import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Lock, ShieldCheck, UserX } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/trust-safety")({
  head: () => ({
    meta: [
      { title: "ট্রাস্ট ও নিরাপত্তা · Trust & Safety — Protidhwani" },
      {
        name: "description",
        content:
          "How Protidhwani protects reporters: anonymity, data handling, moderation rules, emergency escalation and how to report abuse.",
      },
      { property: "og:title", content: "ট্রাস্ট ও নিরাপত্তা · Trust & Safety — Protidhwani" },
      {
        property: "og:description",
        content: "Safety, privacy and moderation policies for citizens reporting on Protidhwani.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrustSafetyPage,
});

const pillars = [
  {
    bn: "পরিচয় সুরক্ষা",
    en: "Reporter protection",
    icon: UserX,
    d: "You can post incidents anonymously. Your name and exact location are never attached to a public report unless you choose to add them.",
  },
  {
    bn: "তথ্য নিরাপত্তা",
    en: "Data security",
    icon: Lock,
    d: "Accounts, posts and SOS records are stored with row-level access rules so only you — and the responders you alert — can see your private details.",
  },
  {
    bn: "যাচাই ও লেবেল",
    en: "Verification labels",
    icon: ShieldCheck,
    d: "Content is labelled verified, disputed or unverified. Labels come from community editors, never from automated scoring alone.",
  },
  {
    bn: "জরুরি এসকেলেশন",
    en: "Emergency escalation",
    icon: AlertTriangle,
    d: "SOS and blood alerts notify your area plus the relevant hotlines. Live location sharing stops the moment you mark yourself safe.",
  },
];

const rules = [
  "কোনো হয়রানি নয় — no harassment, doxxing or threats against any person.",
  "গুজব ছড়ানো নিষিদ্ধ — unverified claims must not be presented as confirmed facts.",
  "শিশু ও ভুক্তভোগীর পরিচয় গোপন — never publish identities of minors or survivors.",
  "ভুয়া জরুরি কল নয় — false SOS or blood alerts result in immediate suspension.",
];

function TrustSafetyPage() {
  return (
    <AppShell title={{ bn: "ট্রাস্ট ও নিরাপত্তা", en: "Trust & Safety" }} showBack>
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Civic reporting carries real risk. These are the protections and rules that keep
          Protidhwani usable for people who speak up.
        </p>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {pillars.map((p) => (
          <div key={p.en} className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <span className="grid size-10 place-items-center rounded-2xl bg-verified-soft text-verified">
              <p.icon className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-bold">
              <span lang="bn" className="bn">
                {p.bn}
              </span>{" "}
              <span className="text-muted-foreground">{p.en}</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
          </div>
        ))}
      </div>

      <section className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold">
          <span lang="bn" className="bn">
            কমিউনিটি নিয়ম
          </span>{" "}
          <span className="text-muted-foreground">Community rules</span>
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {rules.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-3xl border border-emergency/30 bg-emergency-soft p-6">
        <h2 className="text-lg font-bold text-emergency">
          <span lang="bn" className="bn">
            অপব্যবহার জানান
          </span>{" "}
          <span className="opacity-80">Report abuse</span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If you see content that endangers someone, email us and we review within 24 hours. For
          immediate danger, call 999 first.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href="mailto:ragibkuet@gmail.com?subject=Protidhwani%20abuse%20report"
            className="rounded-2xl bg-emergency px-4 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95"
          >
            ইমেইল করুন · Email the team
          </a>
          <Link
            to="/emergency"
            className="rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-transform active:scale-95"
          >
            জরুরি সহায়তা · Emergency
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
