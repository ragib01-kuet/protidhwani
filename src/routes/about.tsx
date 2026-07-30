import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "আমাদের লক্ষ্য · Our Mission — Protidhwani" },
      {
        name: "description",
        content:
          "Protidhwani is an independent, citizen-powered civic network for Bangladesh. Read our mission, values and how the platform is built.",
      },
      { property: "og:title", content: "আমাদের লক্ষ্য · Our Mission — Protidhwani" },
      {
        property: "og:description",
        content: "Why Protidhwani exists: verified civic information, safety and collective action for Bangladesh.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    bn: "সত্য",
    en: "Truth",
    d: "প্রতিটি রিপোর্ট যাচাই হয় — every report is checked by community editors before it is marked verified.",
    icon: ShieldCheck,
  },
  {
    bn: "সাহস",
    en: "Courage",
    d: "নাগরিকের কণ্ঠ সুরক্ষিত — citizens can report anonymously and still be heard.",
    icon: Compass,
  },
  {
    bn: "সংহতি",
    en: "Solidarity",
    d: "এলাকা-ভিত্তিক সংগঠন — neighbourhoods organise, respond and help each other in real time.",
    icon: HeartHandshake,
  },
  {
    bn: "অন্তর্ভুক্তি",
    en: "Inclusion",
    d: "বাংলা প্রথম — Bangla-first design so the platform works for everyone, everywhere.",
    icon: Users,
  },
];

function AboutPage() {
  return (
    <AppShell title={{ bn: "আমাদের লক্ষ্য", en: "Our Mission" }} showBack>
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <p lang="bn" className="bn text-2xl font-bold leading-snug">
          প্রতিধ্বনি — নাগরিকের কণ্ঠ, যাচাই করা তথ্য, সম্মিলিত পদক্ষেপ।
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Protidhwani (প্রতিধ্বনি, “echo”) is an independent, citizen-powered civic network for
          Bangladesh. We help people discuss local issues, report incidents, verify information,
          request emergency help, protect their rights and organise their communities — all in one
          place, in Bangla first.
        </p>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {values.map((v) => (
          <div key={v.en} className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <v.icon className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold">
              <span lang="bn" className="bn">
                {v.bn}
              </span>{" "}
              <span className="text-muted-foreground">{v.en}</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.d}</p>
          </div>
        ))}
      </div>

      <section className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold">
          <span lang="bn" className="bn">
            কীভাবে কাজ করে
          </span>{" "}
          <span className="text-muted-foreground">How it works</span>
        </h2>
        <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
          <li>
            <span className="font-semibold text-foreground">১. রিপোর্ট — Report.</span> Citizens post
            incidents, complaints and questions from their own area.
          </li>
          <li>
            <span className="font-semibold text-foreground">২. যাচাই — Verify.</span> Volunteer
            editors cross-check evidence and label each item verified, disputed or unverified.
          </li>
          <li>
            <span className="font-semibold text-foreground">৩. পদক্ষেপ — Act.</span> Communities
            respond: SOS alerts, blood requests, legal help, organised follow-up.
          </li>
        </ol>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/contact"
            className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
          >
            যোগাযোগ করুন · Contact us
          </Link>
          <Link
            to="/editors"
            className="rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold transition-transform active:scale-95"
          >
            সম্পাদক দল · Editors
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
