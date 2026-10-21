import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { isActive, NAV } from "@/features/shell/nav-items";

describe("Navigation (Slice 1)", () => {
  it("zeigt in der iPhone-Tab-Bar genau Today, Tasks, Calendar, Read", () => {
    expect(NAV.filter((n) => n.inTabBar).map((n) => [n.href, n.label])).toEqual([
      ["/", "Today"],
      ["/tasks", "Tasks"],
      ["/calendar", "Calendar"],
      ["/read", "Read"],
    ]);
  });

  it("führt Settings nur in der Sidebar", () => {
    expect(NAV.map((n) => n.href)).toEqual(["/", "/tasks", "/calendar", "/read", "/settings"]);
    expect(NAV.find((n) => n.href === "/settings")?.inTabBar).toBe(false);
  });

  it("markiert Today nur auf / und andere Ziele auch auf Unterseiten", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/read", "/")).toBe(false);
    expect(isActive("/read", "/read")).toBe(true);
    expect(isActive("/read/x", "/read")).toBe(true);
    expect(isActive("/reader", "/read")).toBe(false);
  });
});

describe("Redirects alter Ziele", () => {
  it("leitet Digest und Discover temporär auf Read, Investments auf Today", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual([
      { source: "/digest", destination: "/read", permanent: false },
      { source: "/discover", destination: "/read", permanent: false },
      { source: "/investments", destination: "/", permanent: false },
    ]);
  });

  it("zeigt nie auf ein Ziel, das selbst umgeleitet wird", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    const sources = new Set(redirects.map((r) => r.source));
    for (const r of redirects) expect(sources.has(r.destination)).toBe(false);
    for (const n of NAV) expect(sources.has(n.href)).toBe(false);
  });
});
