import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Advisory {
  id: number;
  bn: string;
  en: string;
  tone: "info" | "caution" | "success";
}

export interface AdvisoryToastProps {
  advisory: Advisory | null;
  onDismiss: () => void;
  /** Auto-hide delay in ms; 0 disables auto-hide. */
  duration?: number;
}

const TONE = {
  info: "border-primary/30 bg-brand-soft text-primary",
  caution: "border-warning/40 bg-warning-soft text-warning",
  success: "border-verified/30 bg-verified-soft text-verified",
} as const;

/** Single-slot toast for advisories and report confirmations. */
export function AdvisoryToast({ advisory, onDismiss, duration = 4500 }: AdvisoryToastProps) {
  useEffect(() => {
    if (!advisory || duration <= 0) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
    // `advisory.id` changes for every new advisory, restarting the timer.
  }, [advisory, duration, onDismiss]);

  if (!advisory) return null;
  const Icon = advisory.tone === "success" ? CheckCircle2 : AlertTriangle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lift backdrop-blur animate-in slide-in-from-top-2 duration-300",
        TONE[advisory.tone],
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        <span lang="bn" className="block text-xs font-bold leading-snug">
          {advisory.bn}
        </span>
        <span lang="en" className="block text-[10px] leading-snug opacity-75">
          {advisory.en}
        </span>
      </span>
      <button
        onClick={onDismiss}
        aria-label="বন্ধ করুন / Dismiss"
        className="grid size-6 shrink-0 place-items-center rounded-full hover:bg-black/5"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
