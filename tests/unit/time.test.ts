import { describe, expect, it } from "vitest";
import { dateLabel, dayOfYear, greeting, isoDate, minusDays, shortDayLabel } from "@/lib/time";

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

describe("shortDayLabel / minusDays", () => {
  it("formatiert Kalendertage ohne Zeitzonen-Verschiebung", () => {
    expect(shortDayLabel("2026-10-13")).toBe("Tue 13 Oct");
    expect(shortDayLabel("2026-03-29")).toBe("Sun 29 Mar"); // Zeitumstellung
  });

  it("rechnet über Monats- und Jahresgrenzen", () => {
    expect(minusDays("2026-10-13", 3)).toBe("2026-10-10");
    expect(minusDays("2026-03-01", 1)).toBe("2026-02-28");
    expect(minusDays("2026-01-01", 1)).toBe("2025-12-31");
  });
});
