import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, Map, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: Home, bn: "হোম", en: "Home" },
  { to: "/explore", icon: Compass, bn: "অন্বেষণ", en: "Explore" },
  { to: "/map", icon: Map, bn: "মানচিত্র", en: "Map" },
  { to: "/community", icon: Users, bn: "কমিউনিটি", en: "Community" },
  { to: "/profile", icon: User, bn: "প্রোফাইল", en: "Profile" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border glass-panel lg:hidden">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map(({ to, icon: Icon, bn, en }) => {
          const active = pathname === to;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
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
  const extra = [
    { to: "/emergency", bn: "জরুরি সহায়তা", en: "Emergency" },
    { to: "/rights", bn: "অধিকার", en: "Rights" },
    { to: "/protest", bn: "প্রতিবাদ মোড", en: "Protest Mode" },
    { to: "/vehicle", bn: "যানবাহন যাচাই", en: "Verify Vehicle" },
  ] as const;

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 border-r border-border bg-surface px-4 py-6 lg:flex">
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

      {[...items, ...extra].map((i) => {
        const active = pathname === i.to;
        return (
          <Link
            key={i.to}
            to={i.to}
            className={cn(
              "rounded-2xl px-3 py-2.5 transition-colors",
              active
                ? "bg-brand-soft text-primary"
                : "text-foreground/80 hover:bg-secondary",
            )}
          >
            <span lang="bn" className="block text-sm font-semibold">
              {i.bn}
            </span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              {i.en}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
