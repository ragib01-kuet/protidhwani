import { ArrowDownRight, ArrowRight, ArrowUpRight, Building2, HeartPulse, ShieldCheck, Users } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft">
        <Icon className="size-4.5 text-primary" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-bold leading-none tabular-nums">{toBnNumber(value)}</span>
        <span lang="bn" className="block truncate text-xs font-semibold leading-tight">
          {bn}
        </span>
        <span lang="en" className="block truncate text-[11px] leading-tight text-muted-foreground">
          {en}
        </span>
      </span>
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
        className={
          isMobile
            ? "flex max-h-[88vh] flex-col gap-0 overflow-y-auto rounded-t-3xl p-0"
            : "flex h-dvh max-h-dvh w-[26rem] flex-col gap-0 overflow-hidden p-0 sm:max-w-[26rem]"
        }
      >
        <SheetHeader className="shrink-0 gap-1 border-b border-border px-5 pb-4 pt-5 text-left">
          <SheetTitle asChild>
            <div className="pr-8">
              <span lang="bn" className="block text-2xl font-bold leading-tight">
                {area.nameBn}
              </span>
              <span lang="en" className="block text-sm font-medium text-muted-foreground">
                {area.nameEn}
              </span>
            </div>
          </SheetTitle>
          {/* Radix requires a description for accessible dialogs. */}
          <SheetDescription asChild>
            <p className="pr-8">
              <span lang="bn" className="block text-[13px] leading-snug text-muted-foreground">
                এলাকার নিরাপত্তা স্কোর, ঘটনা ও সেবা কেন্দ্রের তথ্য
              </span>
            </p>
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-6 pt-5">

          <div
            className="flex items-center gap-4 rounded-3xl border p-4"
            style={{ borderColor: `${band.color}33`, backgroundColor: `${band.color}0f` }}
          >
            <div className="min-w-0">
              <p className="text-[3.25rem] font-bold leading-none tabular-nums" style={{ color: band.color }}>
                {toBnNumber(area.safetyScore)}
              </p>
              <p lang="bn" className="mt-1.5 text-sm font-bold" style={{ color: band.color }}>
                {band.bn}
              </p>
              <p lang="en" className="text-xs text-muted-foreground">
                {band.en} · Safety score
              </p>
            </div>
            <div className={`ml-auto flex shrink-0 items-center gap-2 ${trend.cls}`}>
              <trend.Icon className="size-5" aria-hidden />
              <span>
                <span lang="bn" className="block text-[13px] font-bold">
                  {trend.bn}
                </span>
                <span lang="en" className="block text-[11px] opacity-80">
                  {trend.en}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <StatChip Icon={ShieldCheck} bn="থানা" en="Police" value={area.policeCount} />
            <StatChip Icon={HeartPulse} bn="হাসপাতাল" en="Hospital" value={area.hospitalCount} />
            <StatChip Icon={Building2} bn="আশ্রয়" en="Shelter" value={area.shelterCount} />
            <StatChip Icon={Users} bn="স্বেচ্ছাসেবক" en="Volunteers" value={area.volunteerCount} />
          </div>

          <section className="shrink-0">
            <h3 lang="bn" className="text-[15px] font-bold">
              শীর্ষ রিপোর্ট ধরন
            </h3>
            <p lang="en" className="text-xs text-muted-foreground">
              Top report categories
            </p>
            <ul className="mt-3.5 space-y-3">
              {area.topCategories.map((c) => {
                const label = CATEGORY_LABELS[c.category];
                return (
                  <li key={c.category}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate">
                        <span lang="bn" className="text-[13px] font-bold">
                          {label.bn}
                        </span>
                        <span lang="en" className="ml-1.5 text-xs text-muted-foreground">
                          {label.en}
                        </span>
                      </span>
                      <span className="shrink-0 text-[13px] font-bold tabular-nums">
                        {toBnNumber(c.percent)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
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
            <span lang="bn" className="block text-[13px] font-semibold text-primary">
              {toBnNumber(area.verifiedReports)}টি যাচাইকৃত রিপোর্ট এই এলাকায়
            </span>
            <span lang="en" className="block text-xs text-primary/70">
              {area.verifiedReports} verified community reports
            </span>
          </p>

          <button
            onClick={() => onDirections(area.id)}
            className="mt-auto min-h-12 w-full shrink-0 rounded-2xl bg-primary px-4 py-3 text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <span lang="bn" className="block text-[15px] font-bold">
              নিরাপদ পথ দেখুন
            </span>
            <span lang="en" className="block text-xs opacity-80">
              Compare safer routes
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

