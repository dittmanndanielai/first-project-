import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";
import { checkSessionToken, createSessionToken } from "@/lib/session";

const cfg = { secret: "test-secret-that-is-long-enough-0123456789", version: "1" };

describe("Passwort (scrypt)", () => {
  it("verifiziert das richtige und verwirft ein falsches Passwort", async () => {
    const stored = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", stored)).toBe(true);
    expect(await verifyPassword("wrong", stored)).toBe(false);
  });

  it("verwirft kaputte Hashes ohne Exception", async () => {
    expect(await verifyPassword("x", "bcrypt$abc")).toBe(false);
    expect(await verifyPassword("x", "scrypt$16384$8$1$c2FsdA$c2hvcnQ")).toBe(false);
  });

  it("akzeptiert Hashes aus scripts/hash-password.mjs", async () => {
    const out = execFileSync("node", ["scripts/hash-password.mjs", "aus-dem-skript"], { encoding: "utf8" }).trim();
    expect(await verifyPassword("aus-dem-skript", out)).toBe(true);
  });
});

describe("Session-Token", () => {
  it("ist gültig mit gleichem Secret und gleicher Version", async () => {
    const token = await createSessionToken(cfg);
    expect(await checkSessionToken(token, cfg)).toEqual({ valid: true, renew: false });
  });

  it("wird ungültig nach Erhöhen von SESSION_VERSION (überall abmelden)", async () => {
    const token = await createSessionToken(cfg);
    expect((await checkSessionToken(token, { ...cfg, version: "2" })).valid).toBe(false);
  });

  it("wird mit anderem Secret oder ohne Token abgelehnt", async () => {
    const token = await createSessionToken(cfg);
    expect((await checkSessionToken(token, { ...cfg, secret: "x".repeat(40) })).valid).toBe(false);
    expect((await checkSessionToken(undefined, cfg)).valid).toBe(false);
    expect((await checkSessionToken("not.a.jwt", cfg)).valid).toBe(false);
  });
});
