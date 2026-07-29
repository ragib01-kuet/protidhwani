import { createFileRoute } from "@tanstack/react-router";
import { WifiOff, Phone } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "জরুরি সহায়তা · Emergency Help — Protidhwani" },
      { name: "description", content: "One-tap emergency access: 999, SOS broadcast, medical, fire, police and missing person alerts." },
      { property: "og:title", content: "জরুরি সহায়তা · Emergency Help" },
      { property: "og:description", content: "One-tap 999, SOS, medical, fire and police help with an offline message queue." },
    ],
  }),
  component: Emergency,
});

const actions = [
  { bn: "৯৯৯ কল", en: "Call 999", icon: "📞" },
  { bn: "মেডিকেল", en: "Medical", icon: "🚑" },
  { bn: "ফায়ার সার্ভিস", en: "Fire", icon: "🔥" },
  { bn: "পুলিশ", en: "Police", icon: "🚓" },
  { bn: "নিখোঁজ ব্যক্তি", en: "Missing Person", icon: "👤" },
  { bn: "জরুরি বার্তা", en: "Emergency Text", icon: "✉️" },
];

function Emergency() {
  return (
    <AppShell title={{ bn: "জরুরি সহায়তা", en: "Emergency Help" }} showSearch={false}>
      <button className="grid w-full place-items-center gap-2 rounded-[2rem] bg-emergency px-6 py-10 text-emergency-foreground shadow-lift transition-transform hover:scale-[1.01] active:scale-95">
        <span className="grid size-20 place-items-center rounded-full bg-emergency-foreground/15 pulse-ring text-3xl">
          🚨
        </span>
        <span lang="bn" className="mt-2 text-3xl font-bold tracking-tight">এসওএস পাঠান</span>
        <span lang="en" className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
          Send SOS · holds location & contacts
        </span>
      </button>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <button
            key={a.en}
            className="flex min-h-28 flex-col justify-between rounded-3xl border border-border bg-card p-5 text-left shadow-card transition-all hover:-translate-y-1 hover:border-emergency/40 hover:shadow-lift active:scale-95"
          >
            <span className="text-2xl">{a.icon}</span>
            <span className="mt-3 block">
              <span lang="bn" className="block text-base font-bold leading-tight">{a.bn}</span>
              <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">{a.en}</span>
            </span>
          </button>
        ))}
      </div>

      <section className="mt-5 rounded-[2rem] border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-warning-soft text-warning">
            <WifiOff className="size-5" />
          </span>
          <span className="min-w-0">
            <span lang="bn" className="block text-sm font-bold">অফলাইন কিউ · ৩টি বার্তা অপেক্ষমাণ</span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Offline queue · 3 messages pending
            </span>
          </span>
        </div>
        <p lang="bn" className="mt-3 text-xs leading-relaxed text-muted-foreground">
          নেটওয়ার্ক ফিরে এলে বার্তাগুলো স্বয়ংক্রিয়ভাবে পাঠানো হবে।
        </p>
      </section>

      <section className="mt-5 rounded-[2rem] border border-border bg-card p-5 shadow-card">
        <h2 lang="bn" className="text-base font-bold">জরুরি যোগাযোগ</h2>
        <p lang="en" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Emergency contacts</p>
        <div className="mt-4 space-y-2">
          {[
            { bn: "জাতীয় জরুরি সেবা", en: "National emergency", n: "999" },
            { bn: "নারী ও শিশু সহায়তা", en: "Women & children helpline", n: "109" },
            { bn: "ফায়ার সার্ভিস", en: "Fire service", n: "16163" },
          ].map((c) => (
            <div key={c.n} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-surface px-4 py-3">
              <span className="min-w-0">
                <span lang="bn" className="block truncate text-sm font-semibold">{c.bn}</span>
                <span lang="en" className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground">{c.en}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emergency px-3 py-1.5 text-xs font-bold text-emergency-foreground">
                <Phone className="size-3.5" />
                {c.n}
              </span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
