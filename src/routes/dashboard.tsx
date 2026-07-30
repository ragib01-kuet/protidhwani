import { createFileRoute } from "@tanstack/react-router";
import { Search, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { QuickActionsBar } from "@/components/QuickActionsBar";
import { posts } from "@/lib/civic";


export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "প্রতিধ্বনি · Protidhwani — Civic Network for Bangladesh" },
      {
        name: "description",
        content:
          "Report incidents, verify information, request emergency help and protect rights with Protidhwani, a citizen-powered civic network for Bangladesh.",
      },
      { property: "og:title", content: "প্রতিধ্বনি · Protidhwani" },
      {
        property: "og:description",
        content: "A citizen-powered civic network for Bangladesh — report, verify, organise, stay safe.",
      },
    ],
  }),
  component: Home,
});


function Home() {
  return (
    <AppShell title={{ bn: "প্রতিধ্বনি", en: "Protidhwani" }} showSearch={false}>
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
        <p lang="bn" className="text-2xl font-bold tracking-tight">
          শুভ সকাল, নাগরিক
        </p>
        <p lang="en" className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Good morning, citizen
        </p>

        <label className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 focus-within:border-primary/50">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="এলাকা, ঘটনা বা যানবাহন খুঁজুন · Search"
            lang="bn"
          />
        </label>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { bn: "আজকের রিপোর্ট", en: "Reports today", v: "১,২৪৮" },
            { bn: "যাচাইকৃত", en: "Verified", v: "৮৯%" },
            { bn: "সক্রিয় সতর্কতা", en: "Active alerts", v: "১৭" },
          ].map((s) => (
            <div key={s.en} className="rounded-2xl bg-surface px-3 py-3 text-center">
              <span lang="bn" className="block text-lg font-bold text-primary tabular-nums">
                {s.v}
              </span>
              <span lang="bn" className="block text-[11px] font-semibold">{s.bn}</span>
              <span lang="en" className="block text-[9px] uppercase tracking-wider text-muted-foreground">
                {s.en}
              </span>
            </div>
          ))}
        </div>
      </section>

      <QuickActionsBar />


      <section className="mt-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h2 lang="bn" className="text-base font-bold">কমিউনিটি ফিড</h2>
            <p lang="en" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Community Feed
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-[11px] font-semibold text-primary">
            <TrendingUp className="size-3.5" />
            <span lang="bn">সরাসরি</span>
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
