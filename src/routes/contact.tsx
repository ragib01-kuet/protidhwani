import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, Mail, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export const CONTACT_EMAIL = "ragibkuet@gmail.com";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "যোগাযোগ · Contact — Protidhwani" },
      {
        name: "description",
        content:
          "Contact the Protidhwani team at ragibkuet@gmail.com for press, partnerships, editor applications, abuse reports and product feedback.",
      },
      { property: "og:title", content: "যোগাযোগ · Contact — Protidhwani" },
      {
        property: "og:description",
        content: "Reach the Protidhwani civic network team by email at ragibkuet@gmail.com.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const topics = [
  { bn: "সাধারণ জিজ্ঞাসা", en: "General enquiry", subject: "Protidhwani enquiry" },
  { bn: "সংবাদ ও প্রেস", en: "Press & media", subject: "Protidhwani press enquiry" },
  { bn: "অংশীদারিত্ব", en: "Partnerships", subject: "Protidhwani partnership" },
  { bn: "অপব্যবহার রিপোর্ট", en: "Report abuse", subject: "Protidhwani abuse report" },
];

function ContactPage() {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
    } catch {
      /* clipboard unavailable — the address is visible on screen */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppShell title={{ bn: "যোগাযোগ", en: "Contact" }} showBack>
      <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="size-5" />
        </span>
        <h2 className="mt-4 text-lg font-bold">
          <span lang="bn" className="bn">
            ইমেইল করুন
          </span>{" "}
          <span className="text-muted-foreground">Email us</span>
        </h2>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          data-testid="contact-email"
          className="mt-2 block break-all text-xl font-bold tracking-tight text-primary underline-offset-4 hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        <p className="mt-2 text-sm text-muted-foreground">
          আমরা সাধারণত ২৪–৪৮ ঘণ্টার মধ্যে উত্তর দিই — we usually reply within 24–48 hours.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
          >
            <Mail className="size-4" /> মেইল লিখুন · Write an email
          </a>
          <button
            type="button"
            onClick={copyEmail}
            className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold transition-transform active:scale-95"
          >
            {copied ? <Check className="size-4 text-verified" /> : <Copy className="size-4" />}
            {copied ? "কপি হয়েছে · Copied" : "কপি করুন · Copy address"}
          </button>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          বিষয় অনুযায়ী · By topic
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {topics.map((t) => (
            <a
              key={t.en}
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t.subject)}`}
              className="rounded-3xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift active:scale-95"
            >
              <div className="text-base font-bold">
                <span lang="bn" className="bn">
                  {t.bn}
                </span>{" "}
                <span className="text-muted-foreground">{t.en}</span>
              </div>
              <div className="mt-1 break-all text-xs text-primary">{CONTACT_EMAIL}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold">
          <span lang="bn" className="bn">
            অন্যান্য উপায়
          </span>{" "}
          <span className="text-muted-foreground">Other ways to reach us</span>
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            to="/messages"
            search={{}}
            className="flex items-center gap-3 rounded-2xl border border-border p-4 text-left transition-transform active:scale-95"
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircle className="size-5" />
            </span>
            <span className="text-sm">
              <span lang="bn" className="bn block font-semibold">
                ইন-অ্যাপ মেসেজ
              </span>
              <span className="text-muted-foreground">In-app messages</span>
            </span>
          </Link>
          <a
            href="tel:999"
            className="flex items-center gap-3 rounded-2xl border border-emergency/30 bg-emergency-soft p-4 text-left transition-transform active:scale-95"
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-emergency/10 text-emergency">
              <Phone className="size-5" />
            </span>
            <span className="text-sm">
              <span lang="bn" className="bn block font-semibold">
                জরুরি — ৯৯৯
              </span>
              <span className="text-muted-foreground">Emergency hotline 999</span>
            </span>
          </a>
        </div>
      </section>
    </AppShell>
  );
}
