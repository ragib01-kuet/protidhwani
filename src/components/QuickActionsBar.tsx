import { Link } from "@tanstack/react-router";
import { quickActions } from "@/lib/civic";
import { cn } from "@/lib/utils";

const toneRing = {
  emergency: "bg-emergency-soft text-emergency",
  brand: "bg-brand-soft text-primary",
  verified: "bg-verified-soft text-verified",
  warning: "bg-warning-soft text-warning",
} as const;

/**
 * Quick actions.
 * Mobile: a compact one-line horizontally scrollable menu bar so the feed
 * starts high on the page. Desktop (sm+): the original card grid.
 */
export function QuickActionsBar() {
  return (
    <section className="mt-5 sm:mt-7">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 lang="bn" className="text-base font-bold">
            দ্রুত পদক্ষেপ
          </h2>
          <p lang="en" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Quick Actions
          </p>
        </div>
        <span
          lang="en"
          className="shrink-0 text-[9px] uppercase tracking-wider text-muted-foreground sm:hidden"
        >
          Swipe →
        </span>
      </div>

      {/* Mobile menu bar */}
      <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max items-stretch gap-2">
          {quickActions.map((a) => (
            <li key={a.en}>
              <Link
                to={a.to}
                className="flex w-[76px] flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-2 py-2.5 shadow-card transition-transform active:scale-95"
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl text-base",
                    toneRing[a.tone],
                  )}
                >
                  {a.icon}
                </span>
                <span
                  lang="bn"
                  className="line-clamp-2 text-center text-[10px] font-bold leading-tight"
                >
                  {a.bn}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop grid */}
      <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-4">
        {quickActions.map((a) => (
          <Link
            key={a.en}
            to={a.to}
            className="group flex min-h-28 flex-col justify-between rounded-3xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift active:scale-95"
          >
            <span
              className={cn(
                "grid size-10 place-items-center rounded-2xl text-lg transition-transform group-hover:scale-110",
                toneRing[a.tone],
              )}
            >
              {a.icon}
            </span>
            <span className="mt-3 block min-w-0">
              <span lang="bn" className="block truncate text-sm font-bold">
                {a.bn}
              </span>
              <span lang="en" className="block truncate text-[9px] uppercase tracking-wider text-muted-foreground">
                {a.en}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
