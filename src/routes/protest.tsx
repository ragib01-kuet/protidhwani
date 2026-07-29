import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Route as RouteIcon, Users, WifiOff, BadgeCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/protest")({
  head: () => ({
    meta: [
      { title: "প্রতিবাদ মোড · Protest Mode — Protidhwani" },
      { name: "description", content: "Verified announcements, safe routes, crowd updates and emergency contacts during demonstrations." },
      { property: "og:title", content: "প্রতিবাদ মোড · Protest Mode" },
      { property: "og:description", content: "Safe routes, crowd updates and verified-only announcements with offline queue." },
    ],
  }),
  component: Protest,
});

function Protest() {
  return (
    <AppShell title={{ bn: "প্রতিবাদ মোড", en: "Protest Mode" }} showSearch={false}>
      <section className="rounded-[2rem] border border-warning/40 bg-card p-6 shadow-card">
        <span className="inline-flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1.5 text-[11px] font-bold text-warning">
          <span className="size-2 rounded-full bg-warning" />
          <span lang="bn">কেবল যাচাইকৃত আপডেট</span>
        </span>
        <h2 lang="bn" className="mt-3 text-xl font-bold">নিরাপদ থাকুন, সংগঠিত থাকুন</h2>
        <p lang="en" className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Stay safe, stay organised
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-surface px-4 py-3">
          <WifiOff className="size-4 shrink-0 text-muted-foreground" />
          <span>
            <span lang="bn" className="block text-xs font-bold">অফলাইন বার্তা কিউ সক্রিয়</span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Offline message queue active · 5 queued
            </span>
          </span>
        </div>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { bn: "নিরাপদ রুট", en: "Safe routes", icon: RouteIcon, v: "৪" },
          { bn: "জনসমাগম", en: "Crowd updates", icon: Users, v: "১২" },
          { bn: "ঘোষণা", en: "Announcements", icon: Megaphone, v: "৭" },
        ].map((c) => (
          <div key={c.en} className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <span className="grid size-10 place-items-center rounded-2xl bg-brand-soft text-primary">
              <c.icon className="size-5" />
            </span>
            <span lang="bn" className="mt-3 block text-2xl font-bold text-primary">{c.v}</span>
            <span lang="bn" className="block text-sm font-semibold">{c.bn}</span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">{c.en}</span>
          </div>
        ))}
      </div>

      <section className="mt-5 space-y-3">
        {[
          {
            bn: "শাহবাগ মোড়ে বিকল্প নিরাপদ রুট খোলা",
            en: "Alternate safe route open at Shahbagh",
            t: "২ মিনিট আগে",
          },
          {
            bn: "প্রাথমিক চিকিৎসা কেন্দ্র · টিএসসি",
            en: "First aid point at TSC",
            t: "১১ মিনিট আগে",
          },
          {
            bn: "স্বেচ্ছাসেবক সমন্বয় সভা রাত ৮টা",
            en: "Volunteer coordination at 8 PM",
            t: "৩৫ মিনিট আগে",
          },
        ].map((u) => (
          <article key={u.en} className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <span className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-verified">
              <BadgeCheck className="size-3.5" /> Verified
            </span>
            <h3 lang="bn" className="text-base font-bold">{u.bn}</h3>
            <p lang="en" className="text-xs font-medium text-muted-foreground">{u.en}</p>
            <p lang="bn" className="mt-2 text-[11px] text-muted-foreground">{u.t}</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
