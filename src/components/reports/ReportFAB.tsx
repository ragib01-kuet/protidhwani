import { Plus } from "lucide-react";

export interface ReportFABProps {
  onClick: () => void;
}

/**
 * Circular primary action button (reference UI). Label is provided through
 * aria-label + title so the control stays icon-only but accessible.
 */
export function ReportFAB({ onClick }: ReportFABProps) {
  return (
    <button
      onClick={onClick}
      title="নতুন রিপোর্ট দিন · Add a new report"
      aria-label="নতুন রিপোর্ট দিন / Add a new report"
      className="pointer-events-auto grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
    >
      <Plus className="size-7" strokeWidth={2.4} aria-hidden />
    </button>
  );
}
