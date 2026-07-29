import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Bell, Plus } from "lucide-react";
import { BottomNav, SideNav } from "./BottomNav";
import { Composer } from "./Composer";

export function AppShell({
  children,
  title,
  subtitle,
  showSearch = true,
}: {
  children: ReactNode;
  title: { bn: string; en: string };
  subtitle?: string;
  showSearch?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <SideNav />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border glass-panel">
          <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
            <div className="min-w-0">
              <h1 lang="bn" className="truncate text-xl font-bold tracking-tight">
                {title.bn}
              </h1>
              <p lang="en" className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {title.en}
                {subtitle ? ` · ${subtitle}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {showSearch && (
                <button
                  aria-label="Search"
                  className="grid size-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
                >
                  <Search className="size-5" />
                </button>
              )}
              <button
                aria-label="Alerts"
                className="relative grid size-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
              >
                <Bell className="size-5" />
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-emergency" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 pb-32 pt-5 lg:pb-16">{children}</main>
      </div>

      <Composer />
      <BottomNav />
      <Link
        to="/emergency"
        aria-label="Emergency"
        className="fixed bottom-24 right-4 z-40 grid size-14 place-items-center rounded-full bg-emergency text-emergency-foreground shadow-lift transition-transform hover:scale-105 active:scale-95 lg:bottom-8"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  );
}
