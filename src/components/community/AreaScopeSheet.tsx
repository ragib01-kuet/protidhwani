import { useEffect, useState } from "react";
import { Crosshair, Loader2, MapPin, X } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DISTRICT_TREE, scopeLabel, type AreaScope } from "@/data/bd-areas";
import type { GeoStatus } from "@/hooks/useAreaScope";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: AreaScope | null;
  status: GeoStatus;
  accuracyKm: number | null;
  onDetect: () => void;
  onApply: (district: string, upazila: string | null, union: string | null) => void;
  onClear: () => void;
}

/** জেলা → উপজেলা → ইউনিয়ন cascade with a "use my location" shortcut. */
export function AreaScopeSheet({
  open,
  onOpenChange,
  scope,
  status,
  accuracyKm,
  onDetect,
  onApply,
  onClear,
}: Props) {
  const [district, setDistrict] = useState(scope?.district ?? "");
  const [upazila, setUpazila] = useState<string | null>(scope?.upazila ?? null);
  const [union, setUnion] = useState<string | null>(scope?.union ?? null);

  useEffect(() => {
    if (!open) return;
    setDistrict(scope?.district ?? "");
    setUpazila(scope?.upazila ?? null);
    setUnion(scope?.union ?? null);
  }, [open, scope]);

  const districtNode = DISTRICT_TREE.find((d) => d.en === district) ?? null;
  const upazilaNode = districtNode?.upazilas.find((x) => x.en === upazila) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto rounded-[2rem] p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4 text-left">
          <DialogTitle>
            <span lang="bn" className="block text-lg font-bold">
              আপনার এলাকা নির্বাচন করুন
            </span>
            <span lang="en" className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Choose your area · District → Upazila → Union
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-5 py-5">
          <button
            type="button"
            onClick={onDetect}
            disabled={status === "locating"}
            className="flex w-full items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-left text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-70"
          >
            {status === "locating" ? (
              <Loader2 className="size-5 shrink-0 animate-spin" />
            ) : (
              <Crosshair className="size-5 shrink-0" />
            )}
            <span className="min-w-0">
              <span lang="bn" className="block text-sm font-bold">
                আমার অবস্থান ব্যবহার করুন
              </span>
              <span lang="en" className="block text-[10px] uppercase tracking-wider opacity-80">
                Use my location · needs permission
              </span>
            </span>
          </button>

          {status === "denied" && (
            <p className="rounded-2xl bg-emergency-soft px-4 py-3 text-xs text-emergency">
              <span lang="bn" className="font-bold">
                অবস্থানের অনুমতি দেওয়া হয়নি।
              </span>{" "}
              <span lang="en">
                Location permission was denied — pick your area manually below, or enable location
                for this site in your browser settings.
              </span>
            </p>
          )}
          {status === "unavailable" && (
            <p className="rounded-2xl bg-warning-soft px-4 py-3 text-xs text-warning">
              <span lang="bn" className="font-bold">
                অবস্থান পাওয়া যায়নি।
              </span>{" "}
              <span lang="en">Location unavailable — select your area manually.</span>
            </p>
          )}
          {status === "granted" && scope?.source === "gps" && (
            <p className="rounded-2xl bg-verified-soft px-4 py-3 text-xs text-verified">
              <span lang="bn" className="font-bold">
                আপনার নিকটতম এলাকা: {scopeLabel(scope).bn}
              </span>{" "}
              <span lang="en">
                Nearest area {scopeLabel(scope).en}
                {accuracyKm !== null ? ` · ~${accuracyKm} km away` : ""}
              </span>
            </p>
          )}

          <div className="space-y-2">
            <Label bn="জেলা" en="District" />
            <div className="grid grid-cols-2 gap-2">
              {DISTRICT_TREE.map((d) => (
                <Choice
                  key={d.en}
                  active={district === d.en}
                  bn={d.bn}
                  en={d.en}
                  onClick={() => {
                    setDistrict(d.en);
                    setUpazila(null);
                    setUnion(null);
                  }}
                />
              ))}
            </div>
          </div>

          {districtNode && (
            <div className="space-y-2">
              <Label bn="উপজেলা / থানা" en="Upazila / Thana" />
              <div className="grid grid-cols-2 gap-2">
                {districtNode.upazilas.map((x) => (
                  <Choice
                    key={x.en}
                    active={upazila === x.en}
                    bn={x.bn}
                    en={x.en}
                    onClick={() => {
                      setUpazila(upazila === x.en ? null : x.en);
                      setUnion(null);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {upazilaNode && (
            <div className="space-y-2">
              <Label bn="ইউনিয়ন / এলাকা" en="Union / Area" />
              <div className="grid grid-cols-2 gap-2">
                {upazilaNode.unions.map((x) => (
                  <Choice
                    key={x.en}
                    active={union === x.en}
                    bn={x.bn}
                    en={x.en}
                    onClick={() => setUnion(union === x.en ? null : x.en)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-card px-5 py-4">
          <button
            type="button"
            onClick={() => {
              onClear();
              onOpenChange(false);
            }}
            className="rounded-full border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground"
          >
            <span lang="bn">সারা দেশ</span> · <span lang="en">Nationwide</span>
          </button>
          <button
            type="button"
            disabled={!district}
            onClick={() => {
              onApply(district, upazila, union);
              onOpenChange(false);
            }}
            className="ml-auto flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <MapPin className="size-4" />
            <span lang="bn">এই এলাকা দেখুন</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Label({ bn, en }: { bn: string; en: string }) {
  return (
    <p>
      <span lang="bn" className="text-sm font-bold">
        {bn}
      </span>{" "}
      <span lang="en" className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {en}
      </span>
    </p>
  );
}

function Choice({
  active,
  bn,
  en,
  onClick,
}: {
  active: boolean;
  bn: string;
  en: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-2xl border px-3 py-2.5 text-left transition-all active:scale-[0.98]",
        active ? "border-primary bg-brand-soft" : "border-border bg-surface hover:border-primary/40",
      )}
    >
      <span lang="bn" className={cn("block text-sm font-bold leading-tight", active && "text-primary")}>
        {bn}
      </span>
      <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
        {en}
      </span>
    </button>
  );
}

/** Compact always-visible banner showing the active scope. */
export function AreaScopeBar({
  scope,
  onOpen,
  onDetect,
  status,
  count,
}: {
  scope: AreaScope | null;
  onOpen: () => void;
  onDetect: () => void;
  status: GeoStatus;
  count: number;
}) {
  const label = scope ? scopeLabel(scope) : null;
  return (
    <section className="rounded-[1.75rem] border border-border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-primary">
          <MapPin className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          {label ? (
            <>
              <p lang="bn" className="truncate text-sm font-bold">
                {label.bn}
              </p>
              <p lang="en" className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                {label.en} · {count} post{count === 1 ? "" : "s"} in this area
              </p>
            </>
          ) : (
            <>
              <p lang="bn" className="text-sm font-bold">
                এলাকা নির্বাচন করুন
              </p>
              <p lang="en" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Community is area-based · pick your union/upazila
              </p>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onDetect}
            aria-label="আমার অবস্থান / Use my location"
            className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-primary"
          >
            {status === "locating" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Crosshair className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full bg-primary px-3.5 py-2 text-[11px] font-bold text-primary-foreground"
          >
            <span lang="bn">{scope ? "বদলান" : "নির্বাচন"}</span>
          </button>
        </div>
      </div>
      {scope && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <X className="size-3" />
          <span lang="bn">শুধু এই এলাকার পোস্ট দেখানো হচ্ছে</span>
          <span lang="en" className="uppercase tracking-wider">
            · Area-scoped feed
          </span>
        </p>
      )}
    </section>
  );
}
