import { Thermometer } from "lucide-react";

/**
 * Slim always-on temperature scale. The map itself carries no boxes or panels,
 * so this single strip is the only permanent explanation of the heat colours.
 */
export function TemperatureScale() {
  return (
    <div className="pointer-events-auto w-44 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-card backdrop-blur sm:w-52">
      <p className="flex items-center gap-1.5">
        <Thermometer className="size-3.5 shrink-0 text-primary" aria-hidden />
        <span lang="bn" className="text-[12px] font-bold leading-none">
          তাপমাত্রা
        </span>
        <span lang="en" className="text-[10px] leading-none text-muted-foreground">
          Temperature
        </span>
      </p>
      <div
        aria-hidden
        className="mt-1.5 h-1.5 w-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg,#4ade80 0%,#a3e635 22%,#facc15 44%,#fb923c 64%,#ef4444 82%,#b91c1c 100%)",
        }}
      />
      <div className="mt-1 flex items-center justify-between">
        <span lang="bn" className="text-[10px] font-semibold text-muted-foreground">
          নিরাপদ
        </span>
        <span lang="bn" className="text-[10px] font-semibold text-emergency">
          সংকট
        </span>
      </div>
    </div>
  );
}
