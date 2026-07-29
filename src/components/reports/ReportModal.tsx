import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORY_LABELS } from "@/data/safety-data";
import type { Incident, IncidentCategory } from "@/types/safety";
import { cn } from "@/lib/utils";

/** Categories offered in the demo report form. */
const REPORT_CATEGORIES: IncidentCategory[] = [
  "harassment",
  "road_accident",
  "phone_snatching",
  "flood",
  "fire",
  "infrastructure",
  "power_outage",
  "suspicious_activity",
];

const SEVERITIES: { value: Incident["severity"]; bn: string; en: string }[] = [
  { value: 1, bn: "কম", en: "Low" },
  { value: 3, bn: "মাঝারি", en: "Medium" },
  { value: 5, bn: "গুরুতর", en: "Severe" },
];

export interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where the report is pinned — map centre or the simulated user location. */
  location: { lng: number; lat: number };
  areaId: string;
  onSubmit: (incident: Incident) => void;
}

/**
 * Simulated report submission. Nothing leaves the browser: the created
 * incident is pushed into session state and rendered on the heatmap.
 */
export function ReportModal({ open, onOpenChange, location, areaId, onSubmit }: ReportModalProps) {
  const [category, setCategory] = useState<IncidentCategory>("harassment");
  const [severity, setSeverity] = useState<Incident["severity"]>(3);
  const [anonymous, setAnonymous] = useState(true);

  function submit() {
    onSubmit({
      id: `user-${Date.now()}`,
      category,
      lat: location.lat,
      lng: location.lng,
      severity,
      verified: false,
      timestampISO: new Date().toISOString(),
      areaId,
    });
    onOpenChange(false);
    // Reset so the next report starts clean.
    setCategory("harassment");
    setSeverity(3);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle asChild>
            <div>
              <span lang="bn" className="block text-xl font-bold">
                রিপোর্ট যুক্ত করুন
              </span>
              <span lang="en" className="block text-xs font-medium text-muted-foreground">
                Add a community report
              </span>
            </div>
          </DialogTitle>
          <DialogDescription asChild>
            <p>
              <span lang="bn" className="block text-xs">
                এই ডেমোতে রিপোর্ট শুধু আপনার ব্রাউজারে থাকে।
              </span>
              <span lang="en" className="block text-[10px] text-muted-foreground">
                In this demo, reports stay in your browser only.
              </span>
            </p>
          </DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-2">
          <legend lang="bn" className="text-xs font-bold">
            ধরন <span lang="en" className="font-normal text-muted-foreground">· Category</span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {REPORT_CATEGORIES.map((c) => {
              const label = CATEGORY_LABELS[c];
              const active = c === category;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  aria-pressed={active}
                  className={cn(
                    "min-h-11 rounded-2xl border px-3 py-2 text-left transition-colors",
                    active ? "border-primary bg-brand-soft text-primary" : "border-border bg-surface",
                  )}
                >
                  <span lang="bn" className="block text-xs font-bold leading-tight">
                    {label?.bn ?? c}
                  </span>
                  <span lang="en" className="block text-[9px] uppercase tracking-wider text-muted-foreground">
                    {label?.en ?? c}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend lang="bn" className="text-xs font-bold">
            মাত্রা <span lang="en" className="font-normal text-muted-foreground">· Severity</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {SEVERITIES.map((s) => (
              <button
                key={s.value}
                onClick={() => setSeverity(s.value)}
                aria-pressed={s.value === severity}
                className={cn(
                  "min-h-11 rounded-2xl border px-3 py-2 transition-colors",
                  s.value === severity
                    ? "border-emergency bg-emergency-soft text-emergency"
                    : "border-border bg-surface",
                )}
              >
                <span lang="bn" className="block text-xs font-bold">
                  {s.bn}
                </span>
                <span lang="en" className="block text-[9px] uppercase tracking-wider text-muted-foreground">
                  {s.en}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-border bg-surface px-3">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="size-4 accent-[var(--color-primary)]"
          />
          <span>
            <span lang="bn" className="block text-xs font-bold">
              পরিচয় গোপন রাখুন
            </span>
            <span lang="en" className="block text-[9px] uppercase tracking-wider text-muted-foreground">
              Stay anonymous
            </span>
          </span>
        </label>

        <button
          onClick={submit}
          className="min-h-12 w-full rounded-2xl bg-primary px-4 text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <span lang="bn" className="block text-sm font-bold">
            রিপোর্ট জমা দিন
          </span>
          <span lang="en" className="block text-[9px] uppercase tracking-wider opacity-80">
            Submit report
          </span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
