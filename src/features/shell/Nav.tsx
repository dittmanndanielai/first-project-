"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, ChartIcon, DigestIcon, MoonIcon, SlidersIcon, SunIcon, TasksIcon } from "@/components/ui/icons";
import { OrbVisual } from "@/components/ui/Orb";
import { useTheme } from "./theme";

const NAV = [
  { href: "/", label: "Today", tab: "Today", Icon: SunIcon, inTabBar: true },
  { href: "/tasks", label: "Tasks", tab: "Tasks", Icon: TasksIcon, inTabBar: true },
  { href: "/calendar", label: "Calendar", tab: "Calendar", Icon: CalendarIcon, inTabBar: true },
  { href: "/digest", label: "Digest", tab: "Digest", Icon: DigestIcon, inTabBar: true },
  { href: "/investments", label: "Investments", tab: "Invest", Icon: ChartIcon, inTabBar: true },
  { href: "/settings", label: "Settings", tab: "Settings", Icon: SlidersIcon, inTabBar: false },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

/** Sidebar für Mac und iPad quer. `badge` = offene Aufgaben in „Heute“ (null während des Ladens). */
export function Sidebar({ badge }: { badge: number | null }) {
  const pathname = usePathname();
  const { isDark, toggle } = useTheme();
  return (
    <aside className="side">
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px" }}>
        <OrbVisual size={26} small />
        <div style={{ fontSize: 15, fontWeight: 650, letterSpacing: "-.02em" }}>Personal OS</div>
      </div>
      <nav aria-label="Main" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>
              <Icon />
              <span style={{ flex: 1 }}>{label}</span>
              {href === "/tasks" && badge ? (
                <span style={{ fontSize: 11.5, color: "var(--text2)", fontWeight: 500 }}>{badge}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <button type="button" className="nav-item" onClick={toggle} aria-label="Toggle dark mode">
          <MoonIcon />
          <span suppressHydrationWarning>{isDark ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>
    </aside>
  );
}

/** Floating Tab Bar fürs iPhone (Design: 20 px Abstand, 44 px+ Ziele). */
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar" aria-label="Main">
      {NAV.filter((n) => n.inTabBar).map(({ href, tab, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href} className={`tab ${active ? "on" : ""}`} aria-current={active ? "page" : undefined}>
            <Icon size={22} strokeWidth={1.7} />
            <span>{tab}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ThemeButton() {
  const { toggle } = useTheme();
  return (
    <button type="button" className="btn icon-btn" onClick={toggle} aria-label="Toggle dark mode">
      <MoonIcon size={17} />
    </button>
  );
}
