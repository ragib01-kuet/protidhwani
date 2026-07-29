import { INSIGHTS } from "@/data/safety-data";
import { cn } from "@/lib/utils";

const TONE = {
  positive: "border-verified/30 bg-verified-soft text-verified",
  neutral: "border-border bg-surface text-foreground",
  caution: "border-warning/30 bg-warning-soft text-warning",
} as const;

/** Horizontal strip of pre-written (seeded) community insight cards. */
export function InsightCard() {
  return (
    <div className="scrollbar-none flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1">
      {INSIGHTS.map((insight) => (
        <article
          key={insight.id}
          className={cn(
            "w-[13.5rem] shrink-0 snap-start rounded-2xl border p-3 transition-transform duration-200 hover:-translate-y-0.5",
            TONE[insight.tone],
          )}
        >
          <p className="text-lg font-bold tabular-nums leading-none">{insight.delta}</p>
          <p lang="bn" className="mt-2 text-xs font-bold leading-snug">
            {insight.bn}
          </p>
          <p lang="en" className="mt-1 text-[10px] leading-snug opacity-70">
            {insight.en}
          </p>
        </article>
      ))}
    </div>
  );
}
