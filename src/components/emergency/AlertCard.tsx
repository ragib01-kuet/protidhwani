import { Droplet, MapPin, Navigation, Users } from "lucide-react";

import { relativeTime, toBnNumber } from "@/lib/community-meta";
import { KIND_LABELS, type SosAlert } from "@/services/emergency";
import { cn } from "@/lib/utils";

interface Props {
  alert: SosAlert;
  isMine: boolean;
  onRespond: (alert: SosAlert) => void;
  onTrack: (alert: SosAlert) => void;
  onResolve?: (alert: SosAlert) => void;
}

const STATUS: Record<SosAlert["status"], { bn: string; en: string; cls: string }> = {
  active: { bn: "সক্রিয়", en: "Active", cls: "bg-emergency text-emergency-foreground" },
  responding: { bn: "সাড়া চলছে", en: "Responding", cls: "bg-warning-soft text-warning" },
  resolved: { bn: "সমাধান হয়েছে", en: "Resolved", cls: "bg-brand-soft text-primary" },
  cancelled: { bn: "বাতিল", en: "Cancelled", cls: "bg-surface text-muted-foreground" },
};

/** One community alert in the live emergency feed. */
export function AlertCard({ alert, isMine, onRespond, onTrack, onResolve }: Props) {
  const kind = KIND_LABELS[alert.kind];
  const status = STATUS[alert.status];
  const when = relativeTime(alert.created_at);
  const area = [alert.union_name, alert.upazila, alert.district].filter(Boolean).join(" · ");

  return (
    <article
      data-testid="alert-card"
      className={cn(
        "rounded-[1.75rem] border bg-card p-4 shadow-card transition-all",
        alert.status === "active" ? "border-emergency/40" : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-2xl text-xl",
            alert.kind === "blood" ? "bg-emergency-soft" : "bg-surface",
          )}
        >
          {alert.kind === "blood" ? <Droplet className="size-5 text-emergency" /> : kind.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span lang="bn" className="text-sm font-bold">{kind.bn}</span>
            <span lang="en" className="text-[10px] uppercase tracking-wider text-muted-foreground">{kind.en}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", status.cls)}>
              <span lang="bn">{status.bn}</span>
            </span>
            {alert.is_demo && (
              <span className="rounded-full bg-surface px-2 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
                demo
              </span>
            )}
          </p>
          <p lang="bn" className="mt-1 text-[13px] leading-relaxed text-foreground">
            {alert.message || "জরুরি সহায়তা প্রয়োজন · Help needed"}
          </p>
          {alert.kind === "blood" && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-emergency px-2.5 py-1 font-bold text-emergency-foreground">
                {alert.blood_group}
              </span>
              <span lang="bn" className="font-semibold">
                {toBnNumber(alert.units_needed ?? 1)} ব্যাগ
              </span>
              <span lang="bn" className="truncate text-muted-foreground">{alert.hospital}</span>
            </p>
          )}
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              <span lang="en">{area || "Bangladesh"}</span>
            </span>
            <span lang="bn">{when.bn}</span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" />
              <span lang="bn">{toBnNumber(alert.responders)} জন সাড়া দিয়েছে</span>
            </span>
          </p>
          {alert.author && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              <span lang="bn" className="font-semibold text-foreground">{alert.author.bn}</span>
              <span lang="en"> · {alert.author.en}</span>
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              data-testid="alert-track"
              onClick={() => onTrack(alert)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-[11px] font-bold active:scale-95"
            >
              <Navigation className="size-3.5" />
              <span lang="bn">লাইভ ট্র্যাক</span>
              <span lang="en" className="text-muted-foreground">Track</span>
            </button>
            {!isMine && alert.status !== "resolved" && (
              <button
                data-testid="alert-respond"
                onClick={() => onRespond(alert)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground active:scale-95"
              >
                <span lang="bn">আমি সাড়া দিচ্ছি</span>
                <span lang="en" className="opacity-80">I'm responding</span>
              </button>
            )}
            {isMine && alert.status !== "resolved" && onResolve && (
              <button
                data-testid="alert-resolve"
                onClick={() => onResolve(alert)}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-2 text-[11px] font-bold text-primary active:scale-95"
              >
                <span lang="bn">নিরাপদ আছি</span>
                <span lang="en" className="opacity-70">Mark safe</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
