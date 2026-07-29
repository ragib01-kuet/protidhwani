import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, BadgeCheck, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";

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

function Vehicle() {
  const [q, setQ] = useState("ঢাকা মেট্রো-গ ১১-২৩৪৫");

  return (
    <AppShell title={{ bn: "যানবাহন যাচাই", en: "Verify Vehicle" }} showSearch={false}>
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
        <h2 lang="bn" className="text-lg font-bold">গাড়ির নম্বর লিখুন</h2>
        <p lang="en" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Enter vehicle number</p>
        <label className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-border bg-surface px-4 py-4 focus-within:border-primary">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            lang="bn"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none"
          />
        </label>
        <button className="mt-4 w-full rounded-2xl bg-primary px-6 py-4 text-primary-foreground transition-transform hover:scale-[1.01] active:scale-95">
          <span lang="bn" className="block text-base font-bold">যাচাই করুন</span>
          <span lang="en" className="block text-[10px] uppercase tracking-[0.16em] opacity-80">Verify now</span>
        </button>
      </section>

      <section className="mt-5 rounded-[2rem] border border-border bg-card p-6 shadow-card">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h3 lang="bn" className="truncate text-lg font-bold">{q}</h3>
            <p lang="en" className="text-[10px] uppercase tracking-wider text-muted-foreground">Private car · Toyota Axio 2016</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-verified-soft px-3 py-1.5 text-[11px] font-bold text-verified">
            <BadgeCheck className="size-3.5" />
            <span lang="bn">নিবন্ধিত</span>
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3">
          {[
            { bn: "নিবন্ধন", en: "Registration", v: "সক্রিয় · ২০২৭" },
            { bn: "ফিটনেস", en: "Fitness", v: "বৈধ" },
            { bn: "মালিক যাচাই", en: "Owner verified", v: "হ্যাঁ" },
            { bn: "জননিরাপত্তা রিপোর্ট", en: "Safety reports", v: "২টি" },
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

        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-warning-soft px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <span className="min-w-0">
            <span lang="bn" className="block text-xs font-bold text-warning">২টি জননিরাপত্তা রিপোর্ট রয়েছে</span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-warning/80">
              2 public safety reports on record
            </span>
          </span>
        </div>

        <h4 lang="bn" className="mt-6 text-sm font-bold">ইতিহাস</h4>
        <ol className="mt-3 space-y-3">
          {[
            { bn: "বেপরোয়া চালনার অভিযোগ", en: "Reckless driving report", t: "১০ এপ্রিল" },
            { bn: "মালিকানা হস্তান্তর", en: "Ownership transfer", t: "২ জানুয়ারি" },
          ].map((h) => (
            <li key={h.en} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-surface px-4 py-3">
              <span className="min-w-0">
                <span lang="bn" className="block truncate text-sm font-semibold">{h.bn}</span>
                <span lang="en" className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground">{h.en}</span>
              </span>
              <span lang="bn" className="shrink-0 text-[11px] text-muted-foreground">{h.t}</span>
            </li>
          ))}
        </ol>
      </section>
    </AppShell>
  );
}
