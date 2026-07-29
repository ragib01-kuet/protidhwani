import { Clock, Lamp, ShieldCheck, X } from "lucide-react";

import type { DemoRoute, DemoRouteSet } from "@/types/safety";
import { cn } from "@/lib/utils";
import { safetyBand, toBnNumber } from "@/utils/safetyColor";

export interface RouteComparisonPanelProps {
  routeSet: DemoRouteSet | null;
  /** Destination requested that has no seeded route pair. Renders an empty state. */
  emptyFor?: { bn: string; en: string } | null;
  selectedRouteId: DemoRoute["id"];
  onSelectRoute: (id: DemoRoute["id"]) => void;
  onClose: () => void;
}

const ROUTE_LABEL: Record<DemoRoute["id"], { bn: string; en: string }> = {
  safest: { bn: "সবচেয়ে নিরাপদ", en: "Safest" },
  balanced: { bn: "ভারসাম্যপূর্ণ", en: "Balanced" },
  fastest: { bn: "সবচেয়ে দ্রুত", en: "Fastest" },
};

const DENSITY: Record<DemoRoute["incidentDensity"], { bn: string; en: string }> = {
  low: { bn: "কম", en: "Low" },
  medium: { bn: "মাঝারি", en: "Medium" },
  high: { bn: "বেশি", en: "High" },
};

/** Static, pre-computed route comparison — no routing API is called. */
export function RouteComparisonPanel({
  routeSet,
  emptyFor = null,
  selectedRouteId,
  onSelectRoute,
  onClose,
}: RouteComparisonPanelProps) {
  if (!routeSet) {
    if (!emptyFor) return null;
    return (
      <section className="rounded-3xl border border-border bg-card/95 p-4 shadow-lift backdrop-blur animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 lang="bn" className="text-sm font-bold">
              রুট তথ্য নেই
            </h2>
            <p lang="en" className="text-[9px] uppercase tracking-wider text-muted-foreground">
              No route data available
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন / Close"
            className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-3 rounded-2xl border border-dashed border-border bg-surface p-3">
          <span lang="bn" className="block text-xs font-bold">
            {emptyFor.bn} এর জন্য এখনো ডেমো রুট যোগ করা হয়নি।
          </span>
          <span lang="en" className="mt-0.5 block text-[10px] text-muted-foreground">
            No demo route pair is seeded for {emptyFor.en} yet. Try Gulshan 2 from Mirpur 10.
          </span>
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-card/95 p-4 shadow-lift backdrop-blur animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 lang="bn" className="text-sm font-bold">
            নিরাপদ পথ তুলনা
          </h2>
          <p lang="en" className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Safe route comparison (demo data)
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="পথ তুলনা বন্ধ করুন / Close route comparison"
          className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
        >
          <X className="size-4" />
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {routeSet.routes.map((route) => {
          const active = route.id === selectedRouteId;
          const band = safetyBand(route.safetyScore);
          return (
            <li key={route.id}>
              <button
                onClick={() => onSelectRoute(route.id)}
                aria-pressed={active}
                className={cn(
                  "w-full rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.99]",
                  active ? "border-primary bg-brand-soft" : "border-border bg-surface hover:border-primary/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>
                    <span lang="bn" className="block text-sm font-bold">
                      {ROUTE_LABEL[route.id].bn}
                    </span>
                    <span lang="en" className="block text-[9px] uppercase tracking-wider text-muted-foreground">
                      {ROUTE_LABEL[route.id].en}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-lg font-bold tabular-nums" style={{ color: band.color }}>
                      {toBnNumber(route.safetyScore)}
                    </span>
                    <span lang="en" className="block text-[8px] uppercase tracking-wider text-muted-foreground">
                      Safety
                    </span>
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden />
                    <span lang="bn" className="font-semibold">
                      {toBnNumber(route.travelTimeMin)} মিনিট
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="size-3.5" aria-hidden />
                    <span lang="bn" className="font-semibold">
                      ঘটনা: {DENSITY[route.incidentDensity].bn}
                    </span>
                    <span lang="en">· {DENSITY[route.incidentDensity].en}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Lamp className="size-3.5" aria-hidden />
                    <span lang="bn" className="font-semibold">
                      {route.lightingAvailable ? "আলোকিত" : "অন্ধকার"}
                    </span>
                    <span lang="en">· {route.lightingAvailable ? "Lit" : "Unlit"}</span>
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
