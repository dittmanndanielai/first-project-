import { describe, expect, it } from "vitest";
import { tokenErrorCode, upstreamReason } from "@/features/voice/token-error";

describe("tokenErrorCode", () => {
  it("ordnet ElevenLabs-Statuscodes eigenen Fehlercodes zu", () => {
    expect(tokenErrorCode(401)).toBe("key_rejected");
    expect(tokenErrorCode(403)).toBe("key_rejected");
    expect(tokenErrorCode(404)).toBe("agent_not_found");
    expect(tokenErrorCode(429)).toBe("limit_reached");
    expect(tokenErrorCode(500)).toBe("token_failed");
    expect(tokenErrorCode(422)).toBe("token_failed");
  });
});

describe("upstreamReason", () => {
  it("liest nur den maschinenlesbaren Status aus detail.status", () => {
    const body = { detail: { status: "missing_permissions", message: "The API key you used is missing …" } };
    expect(upstreamReason(body)).toBe("missing_permissions");
  });

  it("verwirft alles andere (Freitext, falsche Typen, leere Antwort)", () => {
    expect(upstreamReason({ detail: { status: "Missing permissions for key sk_123" } })).toBeUndefined();
    expect(upstreamReason({ detail: "Not found" })).toBeUndefined();
    expect(upstreamReason({ detail: [{ msg: "field required" }] })).toBeUndefined();
    expect(upstreamReason(null)).toBeUndefined();
    expect(upstreamReason("oops")).toBeUndefined();
  });
});
