import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import founderPhoto from "@/assets/ragib-abid.png.asset.json";

const FACEBOOK_URL =
  "https://web.facebook.com/ragib.abid.49125?rdid=VGI34D4lUzhHyGpw";

const FILE_CARD: { label: string; value: string; href?: string }[] = [
  { label: "Name", value: "Ragib Abid" },
  { label: "Role", value: "Founder · Protiva" },
  { label: "Based in", value: "Khulna, Bangladesh" },
  { label: "Studying", value: "B.Sc. Engineering" },
  { label: "Department", value: "Industrial & Production Eng." },
  { label: "Institution", value: "KUET" },
  { label: "Also builds", value: "NoEscape", href: "https://www.noesc.app" },
  { label: "Email", value: "ragibkuet@gmail.com", href: "mailto:ragibkuet@gmail.com" },
  { label: "Facebook", value: "Profile →", href: FACEBOOK_URL },
];

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "The student builder",
    p: [
      "Ragib is currently pursuing a B.Sc. in Engineering in Industrial & Production Engineering at Khulna University of Engineering & Technology (KUET), one of the most prestigious engineering universities in Bangladesh. Between lectures and lab reports, he writes code, designs interfaces, and answers his own support emails. The team is small on purpose — every decision passes through one head, which is slower than a committee and considerably more coherent.",
    ],
  },
  {
    h: "The thesis behind Protiva",
    p: [
      "Protiva began as an irritation — a thousand half-read PDFs, a yellow highlighter that proved nothing, and the small dishonest moment of closing a tab and pretending it counted as study. Ragib decided the problem was not him. It was the room he had been asked to think in.",
      "He had a stubborn intuition: that the document is a desk, not a display. That highlights should be raw material, not decoration. That privacy is the quietest form of respect a piece of software can offer its user. Protiva is what those beliefs look like when you draw them on the same canvas.",
    ],
  },
  {
    h: "The craft",
    p: [
      "His work spans product design, full-stack development, and visual storytelling. He believes technology should serve human growth, not replace it. Whether he is tightening the spacing on a button or designing a real-time study room, the question is always the same: does this respect the person on the other side of the screen? The products reflect that: opinionated, unfussy, and built for people who would rather finish a chapter than tweet about it.",
    ],
  },
  {
    h: "NoEscape & beyond",
    p: [
      "Before Protiva, there was NoEscape — a platform where accountability isn't enforced through fear, but nurtured through a supportive, transparent system that people actually want to use. Classrooms, coaching centres, remote teams, and self-learners across the globe rely on it. From individual tutors to institutional deployments, the ecosystem Ragib built continues to grow, one disciplined day at a time.",
    ],
  },
  {
    h: "The long game",
    p: [
      "Protiva is not a sprint. It is a slow accretion of small, honest features — each one earned by use, none of them shipped to impress investors. The plan is to keep it that way: local-first, calm, free where it matters, and priced fairly where it doesn't. If the company grows, it grows because the product earned it, one quiet reader at a time.",
    ],
  },
  {
    h: "A standing invitation",
    p: [
      "If you read something on Protidhwani or Protiva that made the next idea click, Ragib would like to hear about it. He answers his own email at ragibkuet@gmail.com, and you can find him on Facebook. The door, as they say, is open.",
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
          "Meet Ragib Abid — student-engineer at KUET, founder of Protiva and NoEscape, and the builder behind Protidhwani.",
      },
      { property: "og:title", content: "প্রতিষ্ঠাতা · Meet Ragib Abid" },
      {
        property: "og:description",
        content:
          "The student-engineer behind Protidhwani, Protiva and NoEscape — building calm, local-first tools.",
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
        <p className="mx-auto mt-4 max-w-2xl text-center text-base italic text-muted-foreground">
          The student-engineer behind Protidhwani, Protiva and NoEscape — building
          calm, local-first tools for people who take their work seriously.
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <figure className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
              <img
                src={founderPhoto.url}
                alt="Ragib Abid, founder of Protiva and NoEscape"
                className="w-full"
                loading="lazy"
              />
              <figcaption className="border-t border-border px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Ragib Abid · photographed at his desk
              </figcaption>
            </figure>

            <dl className="overflow-hidden rounded-3xl border border-border bg-card text-sm shadow-card">
              <div className="border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                File card
              </div>
              {FILE_CARD.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0"
                >
                  <dt className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
                    {row.label}
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
              agib Abid is not just a developer — he is an architect of discipline. At
              an age when most people are still figuring out what they want to build,
              he had already identified the problem he wanted to solve: the silence
              that replaces action when nobody is watching. That instinct became{" "}
              <a
                href="https://www.noesc.app"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                NoEscape
              </a>
              , an accountability platform now used from Dhaka to London. And it is the
              same instinct that led him to build{" "}
              <a
                href="https://www.protiva.me"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Protiva
              </a>{" "}
              — a calm, local-first workspace for people who believe the next twenty
              minutes of reading should actually count.
            </p>

            {SECTIONS.map((s) => (
              <section key={s.h} className="space-y-3">
                <h3 className="text-lg font-bold tracking-tight">{s.h}</h3>
                {s.p.map((para) => (
                  <p key={para.slice(0, 24)}>{para}</p>
                ))}
              </section>
            ))}

            <blockquote className="rounded-3xl border-l-4 border-primary bg-surface px-5 py-4 text-base font-medium italic">
              “Discipline isn&apos;t a punishment. It&apos;s the foundation of
              everything meaningful you&apos;ll ever build.”
            </blockquote>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="mailto:ragibkuet@gmail.com"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Mail className="size-4" /> Write to the founder
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
