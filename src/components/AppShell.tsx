import { useState, type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, LayoutGrid, MessageCircle, Plus, Search, X } from "lucide-react";
import { BottomNav, SideNav } from "./BottomNav";
import { Composer } from "./Composer";
import { NotificationsBell } from "./NotificationsBell";
import { useAuth } from "@/hooks/useAuth";
import { TOOLS_NAV } from "@/lib/nav";

export function AppShell({
  children,
  title,
  subtitle,
  showSearch = true,
  onSearchClick,
  hideComposer = false,
  showBack = false,
}: {
  children: ReactNode;
  title: { bn: string; en: string };
  subtitle?: string;
  showSearch?: boolean;
  /** Called when the header search button is pressed. */
  onSearchClick?: () => void;
  /** Hide the global composer when the page provides its own. */
  hideComposer?: boolean;
  /** Show a native-style back affordance in the header. */
  showBack?: boolean;
}) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <SideNav />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border glass-panel">
          <div className="mx-auto grid max-w-3xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
            {showBack ? (
              <button
                aria-label="ফিরে যান / Go back"
                onClick={() => router.history.back()}
                className="grid size-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
              >
                <ArrowLeft className="size-5" />
              </button>
            ) : (
              <span className="hidden" />
            )}
            <div className="flex min-w-0 items-center gap-2.5">
              <BrandLogo size={32} className="shrink-0" />
              <div className="min-w-0">
                <h1 lang="bn" className="truncate text-xl font-bold tracking-tight">
                  {title.bn}
                </h1>
                <p lang="en" className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {title.en}
                  {subtitle ? ` · ${subtitle}` : ""}
                </p>
              </div>
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
              <Link
                to="/messages"
                search={{}}
                aria-label="বার্তা / Messages"
                className="grid size-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
              >
                <MessageCircle className="size-5" />
              </Link>
              <NotificationsBell />
              <button
                aria-label="আরও / More"
                onClick={() => setMenuOpen(true)}
                className="grid size-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:text-primary lg:hidden"
              >
                <LayoutGrid className="size-5" />
              </button>
            </div>
          </div>
        </header>

        <main
          key={router.state.location.pathname}
          className="mx-auto max-w-3xl px-4 pb-32 pt-5 duration-300 animate-in fade-in slide-in-from-bottom-2 lg:pb-16"
        >
          {children}
        </main>
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

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 backdrop-blur-sm lg:hidden">
          <button aria-label="Close" className="absolute inset-0" onClick={() => setMenuOpen(false)} />
          <div className="relative w-full rounded-t-[2rem] border border-border bg-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-lift duration-300 animate-in slide-in-from-bottom">
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-border" />
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 lang="bn" className="text-lg font-bold">
                  নাগরিক সেবা
                </h2>
                <p lang="en" className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Civic tools
                </p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="grid size-10 place-items-center rounded-2xl border border-border text-muted-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TOOLS_NAV.map((t) => (
                <Link
                  key={t.to}
                  to={t.to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl border border-border bg-surface px-4 py-3 transition-colors active:scale-95"
                >
                  <span lang="bn" className="block text-sm font-bold">
                    {t.bn}
                  </span>
                  <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t.en}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-4">
              {user ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void signOut();
                  }}
                  className="w-full rounded-2xl border border-border px-4 py-3 text-sm font-semibold"
                >
                  সাইন আউট · Sign out
                </button>
              ) : (
                <Link
                  to="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full rounded-2xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
                >
                  সাইন ইন · Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
