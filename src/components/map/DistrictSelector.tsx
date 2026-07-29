import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Layers, MapPin } from "lucide-react";

import { DISTRICTS, hasMicroCoverage, microCoverageCount } from "@/data/safety-data";
import type { District } from "@/types/safety";
import { toBnNumber } from "@/utils/bn";

export interface DistrictSelectorProps {
  /** Currently selected district id. */
  value: string;
  onChange: (district: District) => void;
}

/**
 * District / division picker so users can move the map beyond the seeded
 * Dhaka areas. Districts without street-level (micro) data are clearly
 * labelled instead of silently rendering an empty heat surface.
 */
export function DistrictSelector({ value, onChange }: DistrictSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const active = DISTRICTS.find((d) => d.id === value) ?? DISTRICTS[0];
  const activeCovered = hasMicroCoverage(active.id);

  // Close on outside click / Escape so the picker never traps the map.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="জেলা নির্বাচন / Select district"
        className="flex w-full items-center gap-2 rounded-full border border-border bg-card/95 py-1.5 pl-1.5 pr-3 shadow-card backdrop-blur transition-transform active:scale-[0.99]"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-primary">
          <MapPin className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span lang="bn" className="block truncate text-[14px] font-bold leading-tight">
            {active.nameBn}
          </span>
          <span lang="en" className="block truncate text-[11px] leading-tight text-muted-foreground">
            {active.nameEn}
          </span>
        </span>
        {!activeCovered && (
          <span
            lang="bn"
            className="shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning"
          >
            মাইক্রো তাপ নেই
          </span>
        )}
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="জেলা তালিকা / District list"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 max-h-[46dvh] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card/98 p-1.5 shadow-lift backdrop-blur animate-scale-in"
        >
          <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">
            <span lang="bn">মাইক্রো তাপ কেবল ডেটা-সমৃদ্ধ জেলায়</span>{" "}
            <span lang="en">/ Micro heat only in seeded districts</span>
          </p>
          {DISTRICTS.map((d) => {
            const covered = hasMicroCoverage(d.id);
            const selected = d.id === value;
            return (
              <button
                key={d.id}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(d);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors ${
                  selected ? "bg-brand-soft" : "hover:bg-secondary"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span lang="bn" className="block truncate text-[14px] font-bold leading-tight">
                    {d.nameBn}
                  </span>
                  <span lang="en" className="block truncate text-[11px] leading-tight text-muted-foreground">
                    {d.nameEn} · {d.divisionEn}
                  </span>
                </span>
                {covered ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-primary">
                    <Layers className="size-3" aria-hidden />
                    <span lang="bn">{toBnNumber(microCoverageCount(d.id))}</span>
                  </span>
                ) : (
                  <span
                    lang="bn"
                    className="shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning"
                  >
                    তাপ নেই
                  </span>
                )}
                {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
