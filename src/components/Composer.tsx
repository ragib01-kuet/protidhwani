import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PenLine, X } from "lucide-react";
import { composerOptions } from "@/lib/civic";
import { COMPOSER_ROUTES } from "@/lib/nav";

export function Composer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-4 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-primary-foreground shadow-lift transition-transform hover:scale-105 active:scale-95 lg:bottom-8"
      >
        <PenLine className="size-5" />
        <span lang="bn" className="text-sm font-semibold">
          পোস্ট করুন
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
          <button
            aria-label="Close"
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-t-[2rem] border border-border bg-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-lift duration-300 animate-in slide-in-from-bottom">
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-border" />
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 lang="bn" className="text-lg font-bold">
                  কী জানাতে চান?
                </h2>
                <p lang="en" className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Choose a civic post type
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close composer"
                className="grid size-10 place-items-center rounded-2xl border border-border text-muted-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
              {composerOptions.map((o) => (
                <Link
                  key={o.en}
                  to={COMPOSER_ROUTES[o.en] ?? "/community"}
                  onClick={() => setOpen(false)}
                  className="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-3xl border border-border bg-surface p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card active:scale-95"
                >
                  <span className="text-2xl">{o.icon}</span>
                  <span lang="bn" className="text-sm font-semibold leading-none">
                    {o.bn}
                  </span>
                  <span lang="en" className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    {o.en}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
