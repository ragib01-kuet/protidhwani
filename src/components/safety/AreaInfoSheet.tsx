import { ArrowDownRight, ArrowRight, ArrowUpRight, Building2, HeartPulse, ShieldCheck, Users } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CATEGORY_LABELS } from "@/data/safety-data";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AreaProperties } from "@/types/safety";
import { safetyBand, toBnNumber } from "@/utils/safetyColor";

export interface AreaInfoSheetProps {
  area: AreaProperties | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens the route planner with this area preselected as destination. */
  onDirections: (areaId: string) => void;
}

const TREND = {
  improving: { Icon: ArrowUpRight, bn: "উন্নতি হচ্ছে", en: "Improving", cls: "text-verified" },
  stable: { Icon: ArrowRight, bn: "স্থিতিশীল", en: "Stable", cls: "text-muted-foreground" },
  worsening: { Icon: ArrowDownRight, bn: "অবনতি হচ্ছে", en: "Worsening", cls: "text-emergency" },
} as const;

function StatChip({
  Icon,
  bn,
  en,
  value,
}: {
  Icon: typeof ShieldCheck;
  bn: string;
  en: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-3 py-2">
      <Icon className="size-4 text-primary" aria-hidden />
      <p className="mt-1 text-base font-bold tabular-nums">{toBnNumber(value)}</p>
      <p lang="bn" className="text-[11px] font-semibold leading-tight">
        {bn}
      </p>
      <p lang="en" className="text-[8px] uppercase tracking-wider text-muted-foreground">
        {en}
      </p>
    </div>
  );
}

/** Bottom drawer on mobile, side panel on desktop (≥1024px). */
export function AreaInfoSheet({ area, open, onOpenChange, onDirections }: AreaInfoSheetProps) {
  const isMobile = useIsMobile();
  if (!area) return null;

  const band = safetyBand(area.safetyScore);
  const trend = TREND[area.trend];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="max-h-[85vh] overflow-y-auto rounded-t-3xl sm:max-w-md"
      >
        <SheetHeader className="text-left">
          <SheetTitle asChild>
            <div>
              <span lang="bn" className="block text-2xl font-bold leading-tight">
                {area.nameBn}
              </span>
              <span lang="en" className="block text-sm font-medium text-muted-foreground">
                {area.nameEn}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-8">
          <div className="flex items-end gap-4 rounded-3xl border border-border bg-surface p-4">
            <div>
              <p className="text-5xl font-bold leading-none tabular-nums" style={{ color: band.color }}>
                {toBnNumber(area.safetyScore)}
              </p>
              <p lang="bn" className="mt-1 text-xs font-bold" style={{ color: band.color }}>
                {band.bn}
              </p>
              <p lang="en" className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {band.en} · Safety score
              </p>
            </div>
            <div className={`ml-auto flex items-center gap-1.5 ${trend.cls}`}>
              <trend.Icon className="size-5" aria-hidden />
              <span>
                <span lang="bn" className="block text-xs font-bold">
                  {trend.bn}
                </span>
                <span lang="en" className="block text-[8px] uppercase tracking-wider opacity-80">
                  {trend.en}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <StatChip Icon={ShieldCheck} bn="থানা" en="Police" value={area.policeCount} />
            <StatChip Icon={HeartPulse} bn="হাসপাতাল" en="Hospital" value={area.hospitalCount} />
            <StatChip Icon={Building2} bn="আশ্রয়" en="Shelter" value={area.shelterCount} />
            <StatChip Icon={Users} bn="স্বেচ্ছাসেবক" en="Volunteers" value={area.volunteerCount} />
          </div>

          <section>
            <h3 lang="bn" className="text-sm font-bold">
              শীর্ষ রিপোর্ট ধরন
            </h3>
            <p lang="en" className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Top report categories
            </p>
            <ul className="mt-3 space-y-2.5">
              {area.topCategories.map((c) => {
                const label = CATEGORY_LABELS[c.category];
                return (
                  <li key={c.category}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate">
                        <span lang="bn" className="text-xs font-bold">
                          {label.bn}
                        </span>
                        <span lang="en" className="ml-1.5 text-[10px] text-muted-foreground">
                          {label.en}
                        </span>
                      </span>
                      <span className="text-xs font-bold tabular-nums">{toBnNumber(c.percent)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${c.percent}%`, backgroundColor: band.color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="rounded-2xl bg-brand-soft px-4 py-3">
            <span lang="bn" className="block text-xs font-semibold text-primary">
              {toBnNumber(area.verifiedReports)}টি যাচাইকৃত রিপোর্ট এই এলাকায়
            </span>
            <span lang="en" className="block text-[10px] text-primary/70">
              {area.verifiedReports} verified community reports
            </span>
          </p>

          <button
            onClick={() => onDirections(area.id)}
            className="min-h-11 w-full rounded-2xl bg-primary px-4 py-3 text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <span lang="bn" className="block text-sm font-bold">
              নিরাপদ পথ দেখুন
            </span>
            <span lang="en" className="block text-[9px] uppercase tracking-wider opacity-80">
              Compare safer routes
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
