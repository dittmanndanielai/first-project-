import { describe, expect, it } from "vitest";
import { loginSecret, parseEnv } from "@/lib/env";
import { hashPassword, verifyLogin } from "@/lib/password";

const prodBase = { SESSION_SECRET: "a".repeat(20) };

describe("parseEnv", () => {
  it("startet lokal ohne Werte (Demo-Modus, Dev-Passwort)", () => {
    const e = parseEnv({}, false);
    expect(e.DATA_SOURCE).toBe("mock");
    expect(loginSecret(e)).toHaveProperty("hash");
  });

  it("verlangt in Production SESSION_SECRET und ein Login-Passwort", () => {
    expect(() => parseEnv({}, true)).toThrow(/SESSION_SECRET/);
    expect(() => parseEnv(prodBase, true)).toThrow(/AUTH_PASSWORD/);
    expect(() => parseEnv({ ...prodBase, SESSION_SECRET: "zu-kurz" }, true)).toThrow(/SESSION_SECRET/);
  });

  it("nennt in Fehlern nur Namen, nie Werte", () => {
    expect(() => parseEnv({ ...prodBase, AUTH_PASSWORD: "geheim" }, true)).toThrow(/^(?!.*geheim)/);
  });

  it("behandelt leere Werte wie nicht gesetzt", () => {
    expect(() => parseEnv({ ...prodBase, AUTH_PASSWORD: "  ", AUTH_PASSWORD_HASH: "" }, true)).toThrow(/AUTH_PASSWORD/);
  });

  it("verlangt NOTION_TOKEN bei DATA_SOURCE=notion", () => {
    expect(() => parseEnv({ DATA_SOURCE: "notion" }, false)).toThrow(/NOTION_TOKEN/);
  });
});

describe("loginSecret", () => {
  it("nimmt den Hash vor dem Klartext", () => {
    const e = parseEnv({ ...prodBase, AUTH_PASSWORD: "klartext-passwort", AUTH_PASSWORD_HASH: "scrypt$x" }, true);
    expect(loginSecret(e)).toEqual({ hash: "scrypt$x" });
  });

  it("nimmt den Klartext, wenn kein Hash gesetzt ist", () => {
    const e = parseEnv({ ...prodBase, AUTH_PASSWORD: "klartext-passwort" }, true);
    expect(loginSecret(e)).toEqual({ plain: "klartext-passwort" });
  });
});

describe("verifyLogin", () => {
  it("prüft Klartext exakt", async () => {
    expect(await verifyLogin("klartext-passwort", { plain: "klartext-passwort" })).toBe(true);
    expect(await verifyLogin("klartext-passwor", { plain: "klartext-passwort" })).toBe(false);
    expect(await verifyLogin("", { plain: "klartext-passwort" })).toBe(false);
  });

  it("prüft Hashes über scrypt", async () => {
    const hash = await hashPassword("mit-hash-gespeichert");
    expect(await verifyLogin("mit-hash-gespeichert", { hash })).toBe(true);
    expect(await verifyLogin("falsch", { hash })).toBe(false);
  });

  it("akzeptiert lokal das Dev-Passwort", async () => {
    expect(await verifyLogin("dev", loginSecret(parseEnv({}, false)))).toBe(true);
  });
});
