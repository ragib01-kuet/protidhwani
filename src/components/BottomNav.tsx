import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  Map,
  Users,
  User,
  Siren,
  Scale,
  Megaphone,
  Car,
  FileWarning,
  Settings,
  LogIn,
  LogOut,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { PRIMARY_NAV, TOOLS_NAV, isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "/dashboard": Home,
  "/explore": Compass,
  "/map": Map,
  "/community": Users,
  "/profile": User,
  "/emergency": Siren,
  "/rights": Scale,
  "/protest": Megaphone,
  "/vehicle": Car,
  "/complaints": FileWarning,
  "/friends": UserPlus,
  "/messages": MessageCircle,
  "/account": Settings,
};

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border glass-panel lg:hidden">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {PRIMARY_NAV.map(({ to, bn, en }) => {
          const Icon = ICONS[to] ?? Home;
          const active = isActivePath(pathname, to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 transition-all duration-200 active:scale-95",
                  active ? "bg-brand-soft text-primary" : "text-muted-foreground hover:bg-secondary",
                )}
              >
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2.4 : 1.8} />
                <span lang="bn" className="text-[11px] font-semibold leading-none">
                  {bn}
                </span>
                <span lang="en" className="text-[8px] uppercase tracking-wider opacity-70">
                  {en}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SideNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();

  const renderItem = (i: { to: string; bn: string; en: string }) => {
    const Icon = ICONS[i.to] ?? Home;
    const active = isActivePath(pathname, i.to);
    return (
      <Link
        key={i.to}
        to={i.to}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors",
          active ? "bg-brand-soft text-primary" : "text-foreground/80 hover:bg-secondary",
        )}
      >
        <Icon className="size-4 shrink-0" strokeWidth={active ? 2.4 : 1.8} />
        <span className="min-w-0">
          <span lang="bn" className="block truncate text-sm font-semibold">
            {i.bn}
          </span>
          <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
            {i.en}
          </span>
        </span>
      </Link>
    );
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-surface px-4 py-6 lg:flex">
      <Link to="/" className="mb-6 flex items-center gap-3 px-2">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card">
          <span lang="bn" className="text-lg font-bold">
            প্র
          </span>
        </span>
        <span className="min-w-0">
          <span lang="bn" className="block truncate text-base font-bold text-foreground">
            প্রতিধ্বনি
          </span>
          <span lang="en" className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Protidhwani
          </span>
        </span>
      </Link>

      {PRIMARY_NAV.map(renderItem)}

      <p
        lang="en"
        className="mt-5 px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
      >
        Civic tools · নাগরিক সেবা
      </p>
      {TOOLS_NAV.map(renderItem)}

      <div className="mt-auto border-t border-border pt-3">
        {user ? (
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-foreground/80 transition-colors hover:bg-secondary"
          >
            <LogOut className="size-4 shrink-0" />
            <span>
              <span lang="bn" className="block text-sm font-semibold">
                সাইন আউট
              </span>
              <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                Sign out
              </span>
            </span>
          </button>
        ) : (
          <Link
            to="/auth/login"
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-foreground/80 transition-colors hover:bg-secondary"
          >
            <LogIn className="size-4 shrink-0" />
            <span>
              <span lang="bn" className="block text-sm font-semibold">
                সাইন ইন
              </span>
              <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                Sign in
              </span>
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}
