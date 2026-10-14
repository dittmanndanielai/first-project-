import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "@/lib/env";

// Notion, Session und Umgebung werden gemockt; geprüft wird der echte Route Handler samt Logik.
const state = vi.hoisted(() => ({
  session: true,
  env: {} as Partial<Env>,
  archive: [] as unknown[],
  feedback: [] as unknown[],
  calls: [] as { path: string; method?: string; body?: unknown; cached: boolean }[],
  failFeedback: false,
}));

vi.mock("@/lib/auth", () => ({ hasSession: async () => state.session }));
vi.mock("@/lib/env", () => ({ env: () => state.env }));
vi.mock("@/lib/log", () => ({ log: vi.fn(), logError: vi.fn() }));
vi.mock("@/lib/notion", async (orig) => {
  const actual = await orig<typeof import("@/lib/notion")>();
  return {
    ...actual,
    notion: vi.fn(async (path: string, opts: { method?: string; body?: unknown; cache?: unknown } = {}) => {
      state.calls.push({ path, method: opts.method, body: opts.body, cached: !!opts.cache });
      await new Promise((r) => setTimeout(r, 5)); // echte Latenz, damit Doppel-Taps sich überlappen
      if (path.startsWith("data_sources/ARCHIVE/")) return { results: state.archive, has_more: false, next_cursor: null };
      if (path.startsWith("data_sources/FEEDBACK/")) {
        if (state.failFeedback) throw new actual.NotionError(404, "object_not_found", "not shared");
        return { results: state.feedback, has_more: false, next_cursor: null };
      }
      if (path === "pages") return { object: "page", id: "new" };
      throw new Error(`unerwarteter Aufruf ${path}`);
    }),
  };
});

const { POST } = await import("@/app/api/discover/feedback/route");
const { resetFeedbackState } = await import("@/features/discover/feedback");

const rt = (s: string) => ({ rich_text: s ? [{ plain_text: s }] : [] });
function row(storyId: string, over: Record<string, unknown> = {}) {
  return {
    id: `page-${storyId}`,
    created_time: "2026-10-14T06:03:00.000Z",
    properties: {
      Titel: { title: [{ plain_text: `Story ${storyId}` }] },
      Kernaussage: rt("Kernaussage."),
      Datum: { date: { start: "2026-10-14" } },
      Themenfeld: { multi_select: [{ name: "KI" }, { name: "Wirtschaft" }] },
      "Story ID": rt(storyId),
      "Canonical URL": { url: "https://www.example.com/a" },
      Quelle: rt("The Decoder"),
      ...over,
    },
  };
}

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/discover/feedback", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
async function send(body: unknown, headers?: Record<string, string>) {
  const res = await POST(request(body, headers));
  return { status: res.status, body: (await res.json()) as { status: string } };
}
const writes = () => state.calls.filter((c) => c.path === "pages");

beforeEach(() => {
  resetFeedbackState();
  state.session = true;
  state.env = {
    DATA_SOURCE: "notion",
    APP_TIMEZONE: "Europe/Berlin",
    NOTION_DIGEST_DS_ID: "ARCHIVE",
    NOTION_FEEDBACK_DS_ID: "FEEDBACK",
    DISCOVER_FEEDBACK_WRITE: true,
  };
  state.archive = [row("b1e6de99")];
  state.feedback = [];
  state.calls = [];
  state.failFeedback = false;
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-14T10:00:00Z") });
});

describe("POST /api/discover/feedback", () => {
  it("antwortet ohne Sitzung mit 401 und fragt Notion nicht", async () => {
    state.session = false;
    expect(await send({ storyId: "b1e6de99" })).toEqual({ status: 401, body: { status: "unauthorized" } });
    expect(state.calls).toHaveLength(0);
  });

  it("lehnt fremde Origins mit 403 ab", async () => {
    expect((await send({ storyId: "b1e6de99" }, { origin: "https://evil.example" })).status).toBe(403);
  });

  it("lehnt ungültige IDs und kaputte Bodies mit 400 ab", async () => {
    for (const body of [{ storyId: "B1E6DE99" }, { storyId: "abc" }, { storyId: 123 }, {}, "kein json", { storyId: "x".repeat(3000) }]) {
      expect((await send(body)).status).toBe(400);
    }
    expect(state.calls).toHaveLength(0);
  });

  it("meldet unbekannte Stories mit 404 nach einmaliger Direktabfrage im Archiv", async () => {
    const res = await send({ storyId: "deadbeef" });
    expect(res).toEqual({ status: 404, body: { status: "not_found" } });
    const direct = state.calls.filter((c) => c.path === "data_sources/ARCHIVE/query" && !c.cached);
    expect(direct).toHaveLength(1);
    expect(direct[0].body).toMatchObject({ filter: { property: "Story ID", rich_text: { equals: "deadbeef" } } });
    expect(writes()).toHaveLength(0);
  });

  it("findet Stories außerhalb des Feeds über die Direktabfrage", async () => {
    state.archive = [];
    const notion = (await import("@/lib/notion")).notion as unknown as ReturnType<typeof vi.fn>;
    notion.mockImplementationOnce(async () => ({ results: [], has_more: false, next_cursor: null })); // Feed leer
    notion.mockImplementationOnce(async () => ({ results: [row("a1b2c3")], has_more: false, next_cursor: null })); // Direkt
    expect((await send({ storyId: "a1b2c3" })).body.status).toBe("ok");
  });

  it("schreibt einen klick mit serverseitig abgeleiteten Werten", async () => {
    expect(await send({ storyId: "b1e6de99" })).toEqual({ status: 200, body: { status: "ok" } });
    expect(writes()).toHaveLength(1);
    const body = writes()[0].body as { parent: unknown; properties: Record<string, unknown> };
    expect(body.parent).toEqual({ type: "data_source_id", data_source_id: "FEEDBACK" });
    expect(body.properties).toEqual({
      Name: { title: [{ type: "text", text: { content: "Relevant: The Decoder" } }] },
      Typ: { select: { name: "klick" } },
      "Story ID": { rich_text: [{ type: "text", text: { content: "b1e6de99" } }] },
      Quelle: { rich_text: [{ type: "text", text: { content: "The Decoder" } }] },
      Themenfeld: { rich_text: [{ type: "text", text: { content: "KI" } }] },
      Datum: { date: { start: "2026-10-14" } },
    });
  });

  it("ignoriert manipulierte Zusatzfelder im Body", async () => {
    await send({ storyId: "b1e6de99", Quelle: "Fake Feed", Themenfeld: "VC", Typ: "move", Datum: "2000-01-01", name: "x" });
    const props = (writes()[0].body as { properties: Record<string, unknown> }).properties;
    expect(props.Quelle).toEqual({ rich_text: [{ type: "text", text: { content: "The Decoder" } }] });
    expect(props.Themenfeld).toEqual({ rich_text: [{ type: "text", text: { content: "KI" } }] });
    expect(props.Typ).toEqual({ select: { name: "klick" } });
    expect(props.Datum).toEqual({ date: { start: "2026-10-14" } });
  });

  it("lässt eine leere Quelle leer und benennt den Eintrag nach dem Titel", async () => {
    state.archive = [row("b1e6de99", { Quelle: rt(""), "Canonical URL": { url: "https://www.ft.com/x" } })];
    await send({ storyId: "b1e6de99" });
    const props = (writes()[0].body as { properties: Record<string, unknown> }).properties;
    expect(props.Quelle).toEqual({ rich_text: [] }); // kein Hostname: das Scoring erwartet Feednamen
    expect(props.Name).toEqual({ title: [{ type: "text", text: { content: "Relevant: Story b1e6de99" } }] });
  });

  it("schreibt nichts, wenn es heute schon einen klick gibt (auch aus der Mail)", async () => {
    state.feedback = [{ id: "existing" }];
    expect(await send({ storyId: "b1e6de99" })).toEqual({ status: 200, body: { status: "already" } });
    const check = state.calls.find((c) => c.path === "data_sources/FEEDBACK/query");
    expect(check?.cached).toBe(false);
    expect(check?.body).toEqual({
      filter: {
        and: [
          { property: "Story ID", rich_text: { equals: "b1e6de99" } },
          { property: "Datum", date: { equals: "2026-10-14" } },
          { property: "Typ", select: { equals: "klick" } },
        ],
      },
      page_size: 1,
    });
    expect(writes()).toHaveLength(0);
  });

  it("schreibt bei gleichzeitigem Doppel-Tap genau einmal", async () => {
    const [a, b, c] = await Promise.all([send({ storyId: "b1e6de99" }), send({ storyId: "b1e6de99" }), send({ storyId: "b1e6de99" })]);
    expect([a, b, c].map((r) => r.body.status).sort()).toEqual(["already", "already", "ok"]);
    expect(writes()).toHaveLength(1);
    expect((await send({ storyId: "b1e6de99" })).body.status).toBe("already"); // auch kurz danach
    expect(writes()).toHaveLength(1);
  });

  it("prüft im Dry-Run alles echt, schreibt aber nicht", async () => {
    state.env.DISCOVER_FEEDBACK_WRITE = false;
    expect(await send({ storyId: "b1e6de99" })).toEqual({ status: 200, body: { status: "dry-run" } });
    expect(state.calls.map((c) => c.path)).toEqual(["data_sources/ARCHIVE/query", "data_sources/FEEDBACK/query"]);
    expect(writes()).toHaveLength(0);
    expect((await send({ storyId: "b1e6de99" })).body.status).toBe("dry-run"); // Dry-Run merkt sich nichts
  });

  it("antwortet generisch mit 503, wenn Digest Feedback nicht erreichbar ist", async () => {
    state.failFeedback = true;
    expect(await send({ storyId: "b1e6de99" })).toEqual({ status: 503, body: { status: "unavailable" } });
    expect(writes()).toHaveLength(0);
  });

  it("arbeitet im Demo-Modus ohne Notion", async () => {
    state.env.DATA_SOURCE = "mock";
    state.env.DISCOVER_FEEDBACK_WRITE = false;
    expect((await send({ storyId: "a1f0c3d2" })).body.status).toBe("dry-run");
    expect((await send({ storyId: "deadbeef" })).status).toBe(404);
    expect(state.calls).toHaveLength(0);
  });
});
