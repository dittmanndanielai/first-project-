// Hauptnavigation: eine Liste für Sidebar und iPhone-Tab-Bar, Reihenfolge = Anzeige.
// Settings steht nur in der Sidebar und ist sonst über den Avatar erreichbar.

export type NavIcon = "today" | "tasks" | "calendar" | "read" | "settings";

export type NavItem = { href: string; label: string; icon: NavIcon; inTabBar: boolean };

export const NAV: readonly NavItem[] = [
  { href: "/", label: "Today", icon: "today", inTabBar: true },
  { href: "/tasks", label: "Tasks", icon: "tasks", inTabBar: true },
  { href: "/calendar", label: "Calendar", icon: "calendar", inTabBar: true },
  { href: "/read", label: "Read", icon: "read", inTabBar: true },
  { href: "/settings", label: "Settings", icon: "settings", inTabBar: false },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
