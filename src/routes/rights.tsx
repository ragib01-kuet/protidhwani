import { createFileRoute } from "@tanstack/react-router";
import { Scale, FileText, MessageSquarePlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rights")({
  head: () => ({
    meta: [
      { title: "অধিকার ও আইন · Rights & Legal Help — Protidhwani" },
      { name: "description", content: "Ask legal questions, report rights violations and follow verified public cases on a civic timeline." },
      { property: "og:title", content: "অধিকার ও আইন · Rights & Legal Help" },
      { property: "og:description", content: "Community legal help, verified resources and tracked rights cases." },
    ],
  }),
  component: Rights,
});

const timeline = [
  { bn: "অভিযোগ দায়ের", en: "Complaint filed", t: "১২ মে", state: "done" },
  { bn: "প্রমাণ যাচাই", en: "Evidence verified", t: "১৪ মে", state: "done" },
  { bn: "আইনজীবী সংযুক্ত", en: "Legal aid assigned", t: "১৮ মে", state: "active" },
  { bn: "শুনানির অপেক্ষা", en: "Awaiting hearing", t: "—", state: "pending" },
];

function Rights() {
  return (
    <AppShell title={{ bn: "অধিকার ও আইন", en: "Rights & Legal Help" }}>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { bn: "প্রশ্ন করুন", en: "Ask a question", icon: MessageSquarePlus },
          { bn: "লঙ্ঘন জানান", en: "Report violation", icon: Scale },
          { bn: "আইনি রিসোর্স", en: "Legal resources", icon: FileText },
        ].map((a) => (
          <button
            key={a.en}
            className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift active:scale-95"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-verified-soft text-verified">
              <a.icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span lang="bn" className="block truncate text-sm font-bold">{a.bn}</span>
              <span lang="en" className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground">{a.en}</span>
            </span>
          </button>
        ))}
      </div>

      <section className="mt-5 rounded-[2rem] border border-border bg-card p-6 shadow-card">
        <h2 lang="bn" className="text-base font-bold">চলমান মামলা · ওয়ার্ড ২২ উচ্ছেদ</h2>
        <p lang="en" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Open case · Ward 22 eviction
        </p>

        <ol className="mt-5 space-y-0">
          {timeline.map((s, i) => (
            <li key={s.en} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "mt-1 size-3.5 shrink-0 rounded-full border-2",
                    s.state === "done" && "border-primary bg-primary",
                    s.state === "active" && "border-verified bg-verified pulse-ring",
                    s.state === "pending" && "border-border bg-card",
                  )}
                />
                {i < timeline.length - 1 && <span className="my-1 w-px flex-1 bg-border" />}
              </div>
              <div className="pb-6">
                <span lang="bn" className="block text-sm font-bold">{s.bn}</span>
                <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">{s.en}</span>
                <span lang="bn" className="mt-1 block text-xs text-muted-foreground">{s.t}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-5 space-y-3">
        {[
          { bn: "গ্রেপ্তারের সময় আপনার অধিকার", en: "Your rights during arrest" },
          { bn: "ভাড়াটিয়া উচ্ছেদ আইন ২০২৪", en: "Tenant eviction law 2024" },
          { bn: "তথ্য অধিকার আবেদন কীভাবে করবেন", en: "How to file an RTI request" },
        ].map((r) => (
          <article
            key={r.en}
            className="rounded-3xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="mb-2 inline-block rounded-full bg-verified-soft px-3 py-1 text-[10px] font-bold text-verified">
              <span lang="bn">যাচাইকৃত রিসোর্স</span>
            </span>
            <h3 lang="bn" className="text-base font-bold">{r.bn}</h3>
            <p lang="en" className="text-xs font-medium text-muted-foreground">{r.en}</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
