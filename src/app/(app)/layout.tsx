import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { Sidebar, TabBar } from "@/features/shell/Nav";
import { ToastProvider } from "@/features/shell/Toast";
import { deriveToday } from "@/features/tasks/rules";
import { listTasks } from "@/features/tasks/store";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <div className="app">
        <Suspense fallback={<Sidebar badge={null} />}>
          <SidebarWithBadge />
        </Suspense>
        <main className="main">{children}</main>
        <TabBar />
      </div>
    </ToastProvider>
  );
}

// Zähler „offene Heute“ neben Tasks. Gleicher Request-Cache wie die Seite (listTasks ist dedupliziert).
async function SidebarWithBadge() {
  await requireSession();
  const tasks = await listTasks().catch(() => []);
  return <Sidebar badge={deriveToday(tasks).openCount.today} />;
}
