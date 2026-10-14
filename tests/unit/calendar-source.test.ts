import { afterEach, describe, expect, it, vi } from "vitest";
import { calendarUrls, CalendarFetchError, fetchIcs } from "@/features/calendar/source";

const SECRET = "https://p52-caldav.icloud.com/published/2/SECRET-TOKEN-123";
const ICS = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n";

describe("calendarUrls", () => {
  it("akzeptiert iCloud-Links und wandelt webcal:// in https://", () => {
    const { urls, invalid } = calendarUrls("webcal://p52-caldav.icloud.com/published/2/abc");
    expect(invalid).toBe(0);
    expect(urls.map(String)).toEqual(["https://p52-caldav.icloud.com/published/2/abc"]);
  });

  it("liest mehrere Kalender, durch Komma getrennt", () => {
    const { urls } = calendarUrls(" webcal://p52-caldav.icloud.com/a , https://p01-calendarws.icloud.com/b ");
    expect(urls.map((u) => u.hostname)).toEqual(["p52-caldav.icloud.com", "p01-calendarws.icloud.com"]);
  });

  it("verwirft alles, was nicht iCloud über HTTPS ist", () => {
    const bad = [
      "http://p52-caldav.icloud.com/x",
      "https://icloud.com.evil.example/x",
      "https://evil.example/p52-caldav.icloud.com",
      "https://user:pw@p52-caldav.icloud.com/x",
      "https://p52-caldav.icloud.com:8443/x",
      "https://a.b.icloud.com/x",
      "file:///etc/passwd",
      "not a url",
    ];
    for (const raw of bad) expect(calendarUrls(raw), raw).toEqual({ urls: [], invalid: 1 });
  });

  it("behandelt einen leeren Wert als nicht gesetzt", () => {
    expect(calendarUrls(undefined)).toEqual({ urls: [], invalid: 0 });
    expect(calendarUrls(" , ")).toEqual({ urls: [], invalid: 0 });
  });
});

function response(body: string | null, init: ResponseInit = {}) {
  return new Response(body, { status: 200, ...init });
}

async function failure(promise: Promise<unknown>): Promise<CalendarFetchError> {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(CalendarFetchError);
    expect(String((err as Error).message)).not.toContain("SECRET");
    return err as CalendarFetchError;
  }
  throw new Error("expected failure");
}

describe("fetchIcs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lädt ohne Next.js-Cache, mit Timeout und ohne automatische Weiterleitung", async () => {
    const fetchMock = vi.fn(async () => response(ICS));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchIcs(new URL(SECRET))).resolves.toBe(ICS);
    const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
    expect(init).toMatchObject({ cache: "no-store", redirect: "manual" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("folgt Weiterleitungen nur innerhalb von iCloud", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(null, { status: 301, headers: { location: "https://p40-caldav.icloud.com/published/2/x" } }))
      .mockResolvedValueOnce(response(ICS));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchIcs(new URL(SECRET))).resolves.toBe(ICS);
    expect(String(fetchMock.mock.calls[1][0])).toBe("https://p40-caldav.icloud.com/published/2/x");
  });

  it("bricht bei Weiterleitung auf fremde Hosts ab", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(null, { status: 302, headers: { location: "https://evil.example/steal" } })));
    expect((await failure(fetchIcs(new URL(SECRET)))).code).toBe("redirect_not_allowed");
  });

  it("begrenzt die Zahl der Weiterleitungen", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(null, { status: 302, headers: { location: "/again" } })));
    expect((await failure(fetchIcs(new URL(SECRET)))).code).toBe("too_many_redirects");
  });

  it("meldet HTTP-Fehler mit Status, aber ohne Link", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response("gone", { status: 404 })));
    expect((await failure(fetchIcs(new URL(SECRET)))).code).toBe("http_404");
  });

  it("lehnt zu große Antworten ab (laut Header und beim Lesen)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response(ICS, { headers: { "content-length": "99999999" } })));
    expect((await failure(fetchIcs(new URL(SECRET)))).code).toBe("too_large");

    vi.stubGlobal("fetch", vi.fn(async () => response(`BEGIN:VCALENDAR\r\n${"X".repeat(2048)}`)));
    expect((await failure(fetchIcs(new URL(SECRET), { maxBytes: 1024 }))).code).toBe("too_large");
  });

  it("lehnt Antworten ab, die kein Kalender sind", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response("<html>Sign in</html>")));
    expect((await failure(fetchIcs(new URL(SECRET)))).code).toBe("not_ics");
  });

  it("übersetzt Timeouts und Netzwerkfehler in Codes ohne Link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: unknown, init: RequestInit) => {
        await new Promise((_, reject) => init.signal?.addEventListener("abort", () => reject(init.signal?.reason)));
      }),
    );
    expect((await failure(fetchIcs(new URL(SECRET), { timeoutMs: 20 }))).code).toBe("timeout");

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError(`fetch failed: getaddrinfo ENOTFOUND ${SECRET}`))));
    expect((await failure(fetchIcs(new URL(SECRET)))).code).toBe("network");
  });

  it("ruft nie eine Adresse außerhalb von iCloud auf", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await failure(fetchIcs(new URL("https://evil.example/x")))).code).toBe("url_not_allowed");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
