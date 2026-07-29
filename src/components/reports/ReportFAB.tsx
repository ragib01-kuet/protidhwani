import { Plus } from "lucide-react";

export interface ReportFABProps {
  onClick: () => void;
}

/** Floating action button anchored above the bottom sheet area. */
export function ReportFAB({ onClick }: ReportFABProps) {
  return (
    <button
      onClick={onClick}
      aria-label="নতুন রিপোর্ট দিন / Add a new report"
      className="pointer-events-auto flex min-h-14 items-center gap-2 rounded-full bg-primary px-5 text-primary-foreground shadow-lift transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
    >
      <Plus className="size-5" aria-hidden />
      <span className="text-left">
        <span lang="bn" className="block text-sm font-bold leading-none">
          রিপোর্ট
        </span>
        <span lang="en" className="block text-[8px] uppercase tracking-wider opacity-80">
          Report
        </span>
      </span>
    </button>
  );
}
