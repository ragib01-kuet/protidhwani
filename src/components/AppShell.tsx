import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Plus } from "lucide-react";
import { BottomNav, SideNav } from "./BottomNav";
import { Composer } from "./Composer";
import { NotificationsBell } from "./NotificationsBell";

export function AppShell({
  children,
  title,
  subtitle,
  showSearch = true,
  onSearchClick,
  hideComposer = false,
}: {
  children: ReactNode;
  title: { bn: string; en: string };
  subtitle?: string;
  showSearch?: boolean;
  /** Called when the header search button is pressed. */
  onSearchClick?: () => void;
  /** Hide the global composer when the page provides its own. */
  hideComposer?: boolean;
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
                  aria-label="খুঁজুন / Search"
                  onClick={onSearchClick}
                  className="grid size-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
                >
                  <Search className="size-5" />
                </button>
              )}
              <NotificationsBell />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 pb-32 pt-5 lg:pb-16">{children}</main>
      </div>

      {!hideComposer && <Composer />}

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
