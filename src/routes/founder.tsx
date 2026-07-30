import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import founderPhoto from "@/assets/ragib-abid.png.asset.json";

const FACEBOOK_URL =
  "https://web.facebook.com/ragib.abid.49125?rdid=VGI34D4lUzhHyGpw";

const FILE_CARD: { label: string; bn: string; value: string; href?: string }[] = [
  { label: "Name", bn: "নাম", value: "Ragib Abid" },
  { label: "Role", bn: "ভূমিকা", value: "Founder · Protidhwani" },
  { label: "Based in", bn: "অবস্থান", value: "Khulna, Bangladesh" },
  { label: "Studying", bn: "পড়াশোনা", value: "B.Sc. Engineering" },
  { label: "Department", bn: "বিভাগ", value: "Industrial & Production Eng." },
  { label: "Institution", bn: "প্রতিষ্ঠান", value: "KUET" },
  { label: "Also builds", bn: "অন্যান্য কাজ", value: "Protiva · NoEscape", href: "https://www.protiva.me" },
  { label: "Email", bn: "ইমেইল", value: "ragibkuet@gmail.com", href: "mailto:ragibkuet@gmail.com" },
  { label: "Facebook", bn: "ফেসবুক", value: "Profile →", href: FACEBOOK_URL },
];

const SECTIONS: { bn: string; h: string; p: string[] }[] = [
  {
    bn: "কেন প্রতিধ্বনি",
    h: "Why Protidhwani",
    p: [
      "Protidhwani started with a simple, uncomfortable observation: in Bangladesh, most civic problems are not unknown — they are unrecorded. A dark street corner, a repeat snatching spot, a rumour that travels faster than the correction, an emergency where nobody knows who to call first. Everyone in the neighbourhood knows. Nothing in the system does.",
      "The platform is an attempt to give that shared knowledge a place to live: a citizen-powered civic network where a report, a verified claim, or an SOS from one person becomes usable safety for the whole community.",
    ],
  },
  {
    bn: "ছাত্র নির্মাতা",
    h: "The student builder",
    p: [
      "Ragib is pursuing a B.Sc. in Industrial & Production Engineering at Khulna University of Engineering & Technology (KUET). Between lectures and lab reports he writes the code, designs the interfaces, and answers the support emails for Protidhwani himself. The team is small on purpose — every decision passes through one head, which is slower than a committee and considerably more coherent.",
    ],
  },
  {
    bn: "নকশার নীতি",
    h: "The design principles",
    p: [
      "Bangla first, always. Government-grade clarity without government-grade friction. Verification before virality — a claim carries its sources with it. Emergency features that work when the network is bad, because that is exactly when people need them. And privacy treated as the quietest form of respect a piece of software can offer its user.",
      "Whether it is the heat map narrowing to a street, the five-second SOS countdown, or the offline queue in protest mode, the question behind each screen is the same: does this actually help the person holding the phone right now?",
    ],
  },
  {
    bn: "প্রতিভা ও নোএস্কেপ",
    h: "Protiva & NoEscape",
    p: [
      "Before Protidhwani there was NoEscape, a platform where accountability is nurtured through a transparent system rather than enforced through fear, used by classrooms, coaching centres and self-learners. Then came Protiva, a calm, local-first reading workspace built on the belief that a document is a desk, not a display.",
      "Protidhwani carries the same engineering habits into public life: opinionated, unfussy, and built for people who would rather fix the street than argue about it online.",
    ],
  },
  {
    bn: "দীর্ঘ পরিকল্পনা",
    h: "The long game",
    p: [
      "Protidhwani is not a sprint. It is a slow accretion of small, honest features — each one earned by use, none of them shipped to impress investors. The plan is to keep it that way: community-owned in spirit, free where it matters, and useful on a cheap phone with a weak signal in a small upazila town.",
    ],
  },
  {
    bn: "খোলা আমন্ত্রণ",
    h: "A standing invitation",
    p: [
      "If something on Protidhwani helped you — or failed you — Ragib would like to hear about it. Community leaders, journalists, emergency responders and developers who want to plug into the network are welcome to write. He answers his own email at ragibkuet@gmail.com, and you can find him on Facebook. The door, as they say, is open.",
    ],
  },
];

export const Route = createFileRoute("/founder")({
  head: () => ({
    meta: [
      { title: "প্রতিষ্ঠাতা · Meet Ragib Abid | Protidhwani" },
      {
        name: "description",
        content:
          "Meet Ragib Abid — student-engineer at KUET and founder of Protidhwani, the citizen-powered civic network for Bangladesh.",
      },
      { property: "og:title", content: "প্রতিষ্ঠাতা · Meet Ragib Abid" },
      {
        property: "og:description",
        content:
          "The student-engineer building Protidhwani — a Bangla-first civic network for safety, verification and emergency response.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FounderPage,
});

function FounderPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border glass-panel">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link
            to="/"
            aria-label="ফিরে যান / Back to home"
            className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0">
            <h1 lang="bn" className="truncate text-xl font-bold tracking-tight">
              প্রতিষ্ঠাতা
            </h1>
            <p
              lang="en"
              className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
            >
              The founder
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Founder&apos;s note · Special feature
        </p>
        <h2 className="mt-3 text-center text-4xl font-bold tracking-tight sm:text-5xl">
          Meet <span className="text-primary">Ragib Abid</span>
        </h2>
        <p lang="bn" className="mx-auto mt-4 max-w-2xl text-center text-base font-medium">
          প্রতিধ্বনির নির্মাতা — একজন ছাত্র প্রকৌশলী, যিনি বিশ্বাস করেন নিরাপত্তা শুরু হয়
          প্রতিবেশীর কাছ থেকে।
        </p>
        <p
          lang="en"
          className="mx-auto mt-2 max-w-2xl text-center text-sm italic text-muted-foreground"
        >
          The student-engineer building Protidhwani — a Bangla-first civic network for
          safety, verification and emergency response.
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <figure className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
              <img
                src={founderPhoto.url}
                alt="Ragib Abid, founder of Protidhwani"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="border-t border-border px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Ragib Abid · photographed at his desk
              </figcaption>
            </figure>

            <dl className="overflow-hidden rounded-3xl border border-border bg-card text-sm shadow-card">
              <div className="border-b border-border px-4 py-2.5">
                <span lang="bn" className="text-sm font-semibold">
                  পরিচিতি
                </span>
                <span
                  lang="en"
                  className="ml-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                >
                  File card
                </span>
              </div>
              {FILE_CARD.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0"
                >
                  <dt className="shrink-0">
                    <span lang="bn" className="block text-sm font-semibold">
                      {row.bn}
                    </span>
                    <span
                      lang="en"
                      className="block text-[10px] uppercase tracking-wide text-muted-foreground"
                    >
                      {row.label}
                    </span>
                  </dt>
                  <dd className="min-w-0 text-right font-medium">
                    {row.href ? (
                      <a
                        href={row.href}
                        target={row.href.startsWith("mailto:") ? undefined : "_blank"}
                        rel="noreferrer"
                        className="break-words text-primary hover:underline"
                      >
                        {row.value}
                      </a>
                    ) : (
                      <span className="break-words">{row.value}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <article className="space-y-6 text-[15px] leading-relaxed text-foreground/90">
            <p>
              <span className="float-left mr-2 mt-1 text-5xl font-bold leading-none text-primary">
                R
              </span>
              agib Abid is not just a developer — he is an architect of systems that
              hold people together. At an age when most people are still deciding what
              to build, he had already picked his problem: the gap between what a
              community knows and what its institutions can act on. Protidhwani
              (প্রতিধ্বনি — “echo”) is his answer, a civic network where one
              neighbour&apos;s report becomes everyone&apos;s early warning. Before it he
              built{" "}
              <a
                href="https://www.noesc.app"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                NoEscape
              </a>
              , an accountability platform used from Dhaka to London, and{" "}
              <a
                href="https://www.protiva.me"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Protiva
              </a>
              , a calm, local-first reading workspace.
            </p>

            {SECTIONS.map((s) => (
              <section key={s.h} className="space-y-3">
                <h3 lang="bn" className="text-lg font-bold tracking-tight">
                  {s.bn}
                  <span
                    lang="en"
                    className="ml-2 align-middle text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    {s.h}
                  </span>
                </h3>
                {s.p.map((para) => (
                  <p key={para.slice(0, 24)}>{para}</p>
                ))}
              </section>
            ))}

            <blockquote className="rounded-3xl border-l-4 border-primary bg-surface px-5 py-4 text-base font-medium italic">
              <span lang="bn" className="block">
                “নিরাপত্তা কোনো অনুগ্রহ নয় — এটি প্রতিবেশীর প্রতি প্রতিবেশীর দায়িত্ব।”
              </span>
              <span
                lang="en"
                className="mt-2 block text-sm not-italic text-muted-foreground"
              >
                “Safety isn&apos;t a favour handed down. It&apos;s what neighbours owe
                each other.”
              </span>
            </blockquote>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="mailto:ragibkuet@gmail.com"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Mail className="size-4" />
                <span lang="bn">যোগাযোগ</span>
                <span lang="en" className="text-primary-foreground/80">
                  Write to the founder
                </span>
              </a>
              <a
                href="https://www.noesc.app"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:text-primary"
              >
                NoEscape <ExternalLink className="size-4" />
              </a>
              <a
                href="https://www.protiva.me"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:text-primary"
              >
                Open Protiva <ExternalLink className="size-4" />
              </a>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
