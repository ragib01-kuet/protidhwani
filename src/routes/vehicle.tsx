import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { AlertTriangle, BadgeCheck, Loader2, Search, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/integrations/supabase/client";
import { REPORT_KINDS, type VehicleReportRecord } from "@/data/vehicles";
import { lookupVehicle, submitVehicleReport, suggestPlates } from "@/services/vehicles";
import { toBnNumber } from "@/utils/bn";

export const Route = createFileRoute("/vehicle")({
  head: () => ({
    meta: [
      { title: "যানবাহন যাচাই · Verify Vehicle — Protidhwani" },
      { name: "description", content: "Check registration status, public safety reports and ownership verification for any vehicle number." },
      { property: "og:title", content: "যানবাহন যাচাই · Verify Vehicle" },
      { property: "og:description", content: "Registration, status, reports and history for any Bangladeshi vehicle number." },
    ],
  }),
  component: Vehicle,
});

const DEFAULT_PLATE = "ঢাকা মেট্রো-গ ১১-২৩৪৫";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return toBnNumber(d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }));
}

const KIND_LABEL: Record<VehicleReportRecord["kind"], { bn: string; en: string }> =
  Object.fromEntries(REPORT_KINDS.map((k) => [k.value, { bn: k.bn, en: k.en }])) as never;

function Vehicle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [input, setInput] = useState(DEFAULT_PLATE);
  const [plate, setPlate] = useState(DEFAULT_PLATE);
  const [reportOpen, setReportOpen] = useState(false);

  const lookup = useQuery({
    queryKey: ["vehicle", plate],
    queryFn: () => lookupVehicle(plate),
    enabled: plate.trim().length > 0,
  });

  const suggestions = useQuery({
    queryKey: ["vehicle-suggest", input],
    queryFn: () => suggestPlates(input),
  });

  const vehicle = lookup.data?.vehicle ?? null;
  const source = lookup.data?.source;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPlate(input.trim());
  }

  const showSuggestions =
    input.trim() !== plate.trim() && (suggestions.data?.length ?? 0) > 0;

  return (
    <AppShell title={{ bn: "যানবাহন যাচাই", en: "Verify Vehicle" }} showSearch={false}>
      <form onSubmit={onSubmit} className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
        <h2 lang="bn" className="text-lg font-bold">গাড়ির নম্বর লিখুন</h2>
        <p lang="en" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Enter vehicle number</p>
        <label className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-border bg-surface px-4 py-4 focus-within:border-primary">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            lang="bn"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ঢাকা মেট্রো-গ ১১-২৩৪৫"
            aria-label="গাড়ির নম্বর / Vehicle number"
            className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none"
          />
          {input ? (
            <button
              type="button"
              onClick={() => setInput("")}
              aria-label="মুছুন / Clear"
              className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </label>

        {showSuggestions ? (
          <ul className="mt-2 space-y-1">
            {suggestions.data!.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => {
                    setInput(s);
                    setPlate(s);
                  }}
                  lang="bn"
                  className="w-full rounded-xl bg-surface px-4 py-2 text-left text-sm font-semibold hover:bg-secondary"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="submit"
          disabled={!input.trim() || lookup.isFetching}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-primary-foreground transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
        >
          {lookup.isFetching ? <Loader2 className="size-4 animate-spin" /> : null}
          <span>
            <span lang="bn" className="block text-base font-bold">যাচাই করুন</span>
            <span lang="en" className="block text-[10px] uppercase tracking-[0.16em] opacity-80">Verify now</span>
          </span>
        </button>
      </form>

      {lookup.isLoading ? (
        <div className="mt-5 grid place-items-center rounded-[2rem] border border-border bg-card p-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {!lookup.isLoading && !vehicle && plate ? (
        <section className="mt-5 rounded-[2rem] border border-dashed border-border bg-card p-6 text-center shadow-card">
          <ShieldAlert className="mx-auto size-6 text-muted-foreground" />
          <h3 lang="bn" className="mt-2 text-base font-bold">এই নম্বরের কোনো তথ্য পাওয়া যায়নি</h3>
          <p lang="en" className="text-[10px] uppercase tracking-wider text-muted-foreground">
            No record found for this plate
          </p>
          <button
            onClick={() => setReportOpen(true)}
            className="mt-4 rounded-2xl border-2 border-border px-5 py-3 text-sm font-bold"
          >
            <span lang="bn">রিপোর্ট করুন</span>
            <span lang="en" className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">Report</span>
          </button>
        </section>
      ) : null}

      {vehicle ? (
        <section className="mt-5 rounded-[2rem] border border-border bg-card p-6 shadow-card">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h3 lang="bn" className="truncate text-lg font-bold">{vehicle.plate}</h3>
              <p lang="en" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {vehicle.typeEn} · {vehicle.modelEn}
              </p>
            </div>
            <span
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                vehicle.registered ? "bg-verified-soft text-verified" : "bg-emergency-soft text-emergency"
              }`}
            >
              <BadgeCheck className="size-3.5" />
              <span lang="bn">{vehicle.registered ? "নিবন্ধিত" : "অনিবন্ধিত"}</span>
            </span>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3">
            {[
              { bn: "নিবন্ধন", en: "Registration", v: vehicle.registered ? `সক্রিয় · ${toBnNumber(vehicle.registrationExpiry)}` : "মেয়াদোত্তীর্ণ" },
              { bn: "ফিটনেস", en: "Fitness", v: vehicle.fitnessValid ? "বৈধ" : "অবৈধ" },
              { bn: "মালিক যাচাই", en: "Owner verified", v: vehicle.ownerVerified ? "হ্যাঁ" : "না" },
              { bn: "জননিরাপত্তা রিপোর্ট", en: "Safety reports", v: `${toBnNumber(vehicle.reports.length)}টি` },
            ].map((d) => (
              <div key={d.en} className="rounded-2xl bg-surface px-4 py-3">
                <dt>
                  <span lang="bn" className="block text-[11px] font-semibold text-muted-foreground">{d.bn}</span>
                  <span lang="en" className="block text-[9px] uppercase tracking-wider text-muted-foreground/70">{d.en}</span>
                </dt>
                <dd lang="bn" className="mt-1 text-sm font-bold">{d.v}</dd>
              </div>
            ))}
          </dl>

          {vehicle.reports.length > 0 ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-warning-soft px-4 py-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <span className="min-w-0">
                <span lang="bn" className="block text-xs font-bold text-warning">
                  {toBnNumber(vehicle.reports.length)}টি জননিরাপত্তা রিপোর্ট রয়েছে
                </span>
                <span lang="en" className="block text-[10px] uppercase tracking-wider text-warning/80">
                  {vehicle.reports.length} public safety reports on record
                </span>
              </span>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <h4 lang="bn" className="text-sm font-bold">ইতিহাস</h4>
            <span lang="en" className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {source === "live" ? "Live registry" : "Demo registry"}
            </span>
          </div>
          <ol className="mt-3 space-y-3">
            {vehicle.reports.length === 0 ? (
              <li className="rounded-2xl bg-surface px-4 py-3">
                <span lang="bn" className="block text-sm font-semibold">কোনো রিপোর্ট নেই</span>
                <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">No reports yet</span>
              </li>
            ) : (
              vehicle.reports.map((h) => (
                <li key={h.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-surface px-4 py-3">
                  <span className="min-w-0">
                    <span lang="bn" className="block truncate text-sm font-semibold">
                      {h.noteBn || KIND_LABEL[h.kind]?.bn}
                    </span>
                    <span lang="en" className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                      {h.noteEn || KIND_LABEL[h.kind]?.en}
                    </span>
                  </span>
                  <span lang="bn" className="shrink-0 text-[11px] text-muted-foreground">{formatDate(h.createdAtISO)}</span>
                </li>
              ))
            )}
          </ol>

          <button
            onClick={() => setReportOpen(true)}
            className="mt-5 w-full rounded-2xl border-2 border-border px-6 py-3.5 transition-colors hover:border-emergency hover:text-emergency"
          >
            <span lang="bn" className="block text-sm font-bold">এই গাড়ির বিরুদ্ধে রিপোর্ট করুন</span>
            <span lang="en" className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              File a public safety report
            </span>
          </button>
        </section>
      ) : null}

      {reportOpen ? (
        <ReportDialog
          plate={vehicle?.plate ?? plate}
          userId={user?.id ?? null}
          onClose={() => setReportOpen(false)}
          onDone={() => {
            setReportOpen(false);
            queryClient.invalidateQueries({ queryKey: ["vehicle", plate] });
          }}
        />
      ) : null}
    </AppShell>
  );
}

function ReportDialog({
  plate,
  userId,
  onClose,
  onDone,
}: {
  plate: string;
  userId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [kind, setKind] = useState<VehicleReportRecord["kind"]>("reckless");
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("রিপোর্ট করতে সাইন ইন করুন · Sign in to report");
      await submitVehicleReport({ plate, kind, noteBn: note }, userId);
    },
    onSuccess: () => {
      toast.success("রিপোর্ট জমা হয়েছে", { description: "Report submitted" });
      onDone();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/40 p-0 backdrop-blur-sm sm:place-items-center sm:p-6">
      <div className="w-full max-w-md rounded-t-[2rem] border border-border bg-card p-6 shadow-lift sm:rounded-[2rem]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 lang="bn" className="text-base font-bold">রিপোর্ট করুন</h3>
            <p lang="en" className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
              Report · {plate}
            </p>
          </div>
          <button onClick={onClose} aria-label="বন্ধ করুন / Close" className="grid size-9 place-items-center rounded-full hover:bg-secondary">
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {REPORT_KINDS.map((k) => (
            <button
              key={k.value}
              onClick={() => setKind(k.value)}
              aria-pressed={kind === k.value}
              className={`rounded-full border px-3 py-2 text-xs font-bold transition-colors ${
                kind === k.value ? "border-primary bg-brand-soft text-primary" : "border-border bg-surface"
              }`}
            >
              <span lang="bn">{k.bn}</span>
            </button>
          ))}
        </div>

        <textarea
          lang="bn"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="কী ঘটেছে সংক্ষেপে লিখুন…"
          aria-label="বিবরণ / Description"
          className="mt-4 w-full rounded-2xl border-2 border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
        />

        {!userId ? (
          <p className="mt-3 rounded-2xl bg-warning-soft px-4 py-3">
            <span lang="bn" className="block text-xs font-bold text-warning">রিপোর্ট করতে সাইন ইন করুন</span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-warning/80">Sign in to submit a report</span>
          </p>
        ) : null}

        <button
          onClick={() => mutation.mutate()}
          disabled={note.trim().length < 3 || mutation.isPending || !userId}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emergency px-6 py-3.5 text-emergency-foreground disabled:opacity-60"
        >
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          <span>
            <span lang="bn" className="block text-sm font-bold">জমা দিন</span>
            <span lang="en" className="block text-[10px] uppercase tracking-[0.16em] opacity-80">Submit report</span>
          </span>
        </button>
      </div>
    </div>
  );
}
