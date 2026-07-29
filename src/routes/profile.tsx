import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, ShieldCheck, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "প্রোফাইল · Profile — Protidhwani" },
      { name: "description", content: "Your civic profile: contributions, verification level and tracked reports on Protidhwani." },
      { property: "og:title", content: "প্রোফাইল · Profile — Protidhwani" },
      { property: "og:description", content: "Civic contributions, verification level and tracked reports." },
    ],
  }),
  component: Profile,
});

function Profile() {
  return (
    <AppShell title={{ bn: "প্রোফাইল", en: "Profile" }}>
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-4">
          <span lang="bn" className="grid size-16 shrink-0 place-items-center rounded-3xl bg-brand-soft text-xl font-bold text-primary">
            না
          </span>
          <div className="min-w-0">
            <span className="flex items-center gap-2">
              <span lang="bn" className="truncate text-lg font-bold">নাফিস আহমেদ</span>
              <BadgeCheck className="size-5 shrink-0 text-verified" />
            </span>
            <span lang="en" className="block truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Nafis Ahmed · Dhaka
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-verified-soft px-4 py-3">
          <ShieldCheck className="size-4 shrink-0 text-verified" />
          <span>
            <span lang="bn" className="block text-xs font-bold text-verified">যাচাইকৃত নাগরিক · স্তর ৩</span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-verified/70">Verified citizen · Level 3</span>
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { bn: "রিপোর্ট", en: "Reports", v: "৪২" },
            { bn: "যাচাই", en: "Verifications", v: "১৩৮" },
            { bn: "সমর্থন", en: "Support given", v: "২.৪ক" },
          ].map((s) => (
            <div key={s.en} className="rounded-2xl bg-surface px-3 py-3 text-center">
              <span lang="bn" className="block text-lg font-bold text-primary">{s.v}</span>
              <span lang="bn" className="block text-[11px] font-semibold">{s.bn}</span>
              <span lang="en" className="block text-[9px] uppercase tracking-wider text-muted-foreground">{s.en}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[2rem] border border-border bg-card shadow-card">
        {[
          { bn: "আমার রিপোর্ট", en: "My reports" },
          { bn: "অনুসরণ করা মামলা", en: "Followed cases" },
          { bn: "জরুরি যোগাযোগ", en: "Emergency contacts" },
          { bn: "অফলাইন কিউ", en: "Offline queue" },
          { bn: "ভাষা ও অ্যাক্সেসিবিলিটি", en: "Language & accessibility" },
        ].map((r) => (
          <button
            key={r.en}
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4 text-left transition-colors last:border-0 hover:bg-secondary"
          >
            <span className="min-w-0">
              <span lang="bn" className="block truncate text-sm font-semibold">{r.bn}</span>
              <span lang="en" className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground">{r.en}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </section>
    </AppShell>
  );
}
