import { describe, expect, it } from "vitest";
import { dateLabel, dayOfYear, greeting, isoDate } from "@/lib/time";

describe("Zeitzone Europe/Berlin", () => {
  it("liefert nach Mitternacht Berlin schon den neuen Tag, obwohl UTC noch den alten hat", () => {
    const utc2330 = new Date("2026-10-12T23:30:00Z"); // 01:30 in Berlin (MESZ)
    expect(isoDate(utc2330, "UTC")).toBe("2026-10-12");
    expect(isoDate(utc2330)).toBe("2026-10-13");
  });

  it("formatiert wie im Design", () => {
    expect(dateLabel(new Date("2026-10-12T08:00:00Z"))).toBe("Monday, 12 October");
  });

  it("begrüßt passend zur Uhrzeit in Berlin", () => {
    expect(greeting(new Date("2026-10-12T07:00:00Z"), "Daniel")).toBe("Good morning, Daniel");
    expect(greeting(new Date("2026-10-12T13:00:00Z"), "Daniel")).toBe("Good afternoon, Daniel");
    expect(greeting(new Date("2026-10-12T19:00:00Z"), "Daniel")).toBe("Good evening, Daniel");
  });

  it("zählt den Tag des Jahres (12. Oktober 2026 = Tag 285, wie im Design)", () => {
    expect(dayOfYear(new Date("2026-10-12T10:00:00Z"))).toBe(285);
  });
});
