import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, ClipboardCheck, Eye, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/editors")({
  head: () => ({
    meta: [
      { title: "সম্পাদক দল · Community Editors — Protidhwani" },
      {
        name: "description",
        content:
          "Meet the volunteer editors who verify reports on Protidhwani, learn the verification standard and apply to join the review team.",
      },
      { property: "og:title", content: "সম্পাদক দল · Community Editors — Protidhwani" },
      {
        property: "og:description",
        content: "How Protidhwani verifies civic reports, and how to join the volunteer editor team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditorsPage,
});

const desks = [
  { bn: "ঢাকা ডেস্ক", en: "Dhaka desk", members: 14, focus: "Traffic, utilities, harassment reports" },
  { bn: "চট্টগ্রাম ডেস্ক", en: "Chattogram desk", members: 9, focus: "Port area, waterlogging, safety" },
  { bn: "উত্তরাঞ্চল ডেস্ক", en: "Northern desk", members: 7, focus: "Flood, agriculture, local governance" },
  { bn: "জাতীয় ফ্যাক্ট-চেক", en: "National fact-check", members: 11, focus: "Viral claims, images, official notices" },
];

const standard = [
  { bn: "দুইটি স্বাধীন সূত্র", en: "Two independent sources", d: "Every verified label needs at least two independent confirmations." },
  { bn: "মূল প্রমাণ", en: "Original evidence", d: "Photos and videos are checked for origin, date and location before publishing." },
  { bn: "স্বার্থের দ্বন্দ্ব", en: "Conflict of interest", d: "Editors recuse themselves from reports involving their own ward or employer." },
  { bn: "সংশোধন নীতি", en: "Corrections policy", d: "Mistakes are corrected publicly with a visible edit note, never silently deleted." },
];

function EditorsPage() {
  return (
    <AppShell title={{ bn: "সম্পাদক দল", en: "Community Editors" }} showBack>
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-verified/10 px-2.5 py-1 text-xs font-semibold text-verified">
          <BadgeCheck className="size-3.5" /> যাচাই দল · Verification team
        </span>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Protidhwani has no newsroom. Reports are reviewed by volunteer editors from the same
          districts they cover — teachers, students, lawyers, journalists and first responders who
          give a few hours a week to keep civic information trustworthy.
        </p>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {desks.map((d) => (
          <div key={d.en} className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">
                <span lang="bn" className="bn">
                  {d.bn}
                </span>{" "}
                <span className="text-muted-foreground">{d.en}</span>
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <Users className="size-3.5" /> {d.members}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{d.focus}</p>
          </div>
        ))}
      </div>

      <section className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ClipboardCheck className="size-5 text-primary" />
          <span>
            <span lang="bn" className="bn">
              যাচাই মানদণ্ড
            </span>{" "}
            <span className="text-muted-foreground">Verification standard</span>
          </span>
        </h2>
        <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
          {standard.map((s) => (
            <li key={s.en}>
              <span className="font-semibold text-foreground">
                <span lang="bn" className="bn">
                  {s.bn}
                </span>{" "}
                — {s.en}.
              </span>{" "}
              {s.d}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Eye className="size-5 text-primary" />
          <span>
            <span lang="bn" className="bn">
              সম্পাদক হতে চান?
            </span>{" "}
            <span className="text-muted-foreground">Join the team</span>
          </span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Write to us with your district, the topics you can review and roughly how many hours a week
          you can give.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href="mailto:ragibkuet@gmail.com?subject=Protidhwani%20editor%20application"
            className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
          >
            আবেদন করুন · Apply by email
          </a>
          <Link
            to="/trust-safety"
            className="rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold transition-transform active:scale-95"
          >
            ট্রাস্ট ও নিরাপত্তা · Trust &amp; safety
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
