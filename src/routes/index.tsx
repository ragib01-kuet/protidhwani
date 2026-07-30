import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandLockup } from "@/components/BrandLogo";
import {
  AlertTriangle,
  ShieldCheck,
  Scale,
  Radio,
  Users,
  Landmark,
  Search,
  Bell,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Siren,
  ArrowUpRight,
  MessageCircle,
  Share2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Protidhwani — প্রতিধ্বনি | Citizen Civic Network for Bangladesh" },
      {
        name: "description",
        content:
          "Protidhwani is a citizen-powered civic network for Bangladesh. Report incidents, know your rights, verify information, and stay safe with your community.",
      },
      { property: "og:title", content: "Protidhwani — প্রতিধ্বনি | Citizen Civic Network for Bangladesh" },
      {
        property: "og:description",
        content:
          "Protidhwani is a citizen-powered civic network for Bangladesh. Report incidents, know your rights, verify information, and stay safe with your community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Hero />
        <PillarGrid />
        <FeedAndTrending />
        <VerificationBand />
        <EmergencyStrip />
        <PublicInfo />
      </main>
      <Footer />
    </div>
  );
}

/* ---------------------------- Top navigation --------------------------- */

const LANDING_NAV = [
  { to: "/dashboard", en: "Feed" },
  { to: "/complaints", en: "Report" },
  { to: "/rights", en: "Rights" },
  { to: "/explore", en: "Fact-check" },
  { to: "/map", en: "Safety" },
  { to: "/community", en: "Public Info" },
] as const;

function TopBar() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />
        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {LANDING_NAV.map((l) => (
            <Link
              key={l.en}
              to={l.to}
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.en}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void navigate({ to: "/explore" });
            }}
            role="search"
            className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 md:flex"
          >
            <button type="submit" aria-label="খুঁজুন / Search" className="tap grid place-items-center">
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
            <input
              name="q"
              placeholder="Search reports, laws, alerts…"
              className="w-56 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border border-border bg-background px-1.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </form>
          <Link
            to="/explore"
            aria-label="সতর্কতা / Alerts"
            className="tap grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-foreground/80 hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <Link
            to="/auth/login"
            className="tap hidden rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/complaints"
            className="tap inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground shadow-[0_4px_20px_-6px_var(--color-primary)]"
          >
            Report now
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <BrandLockup size={36} />
    </Link>
  );
}

/* -------------------------------- Hero --------------------------------- */

function Hero() {
  return (
    <section className="relative mt-8 overflow-hidden rounded-[32px] border border-border bg-surface">
      {/* Decorative civic pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, color-mix(in oklab, var(--color-primary) 22%, transparent), transparent 55%), radial-gradient(circle at 90% 100%, color-mix(in oklab, var(--color-warning) 20%, transparent), transparent 50%)",
        }}
      />
      <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.15fr_1fr] lg:p-14">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-emergency/60" />
              <span className="relative h-2 w-2 rounded-full bg-emergency" />
            </span>
            Live civic pulse · সারা দেশ
          </div>

          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            The voice of every citizen,
            <br />
            <span className="bn bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              প্রতিধ্বনি
            </span>{" "}
            <span className="text-foreground/70">of a nation.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Report incidents, know your rights, verify what you read, and stay safe during
            crises — all in one trusted, community-verified space built for Bangladesh.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/emergency"
              className="tap inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background"
            >
              <Siren className="h-4 w-4" />
              Report an incident
            </Link>
            <Link
              to="/dashboard"
              className="tap inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold"
            >
              Explore the feed
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
            {[
              { k: "২.৪M+", v: "Citizens" },
              { k: "৬৪", v: "Districts covered" },
              { k: "98%", v: "Verified reports" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl border border-border bg-background/70 p-3">
                <dt className="bn text-lg font-bold tracking-tight">{s.k}</dt>
                <dd className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Live report card mock */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-br from-primary/10 to-transparent blur-2xl" />
          <div className="card-soft relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Dhaka · Mirpur-10
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-verified/10 px-2 py-0.5 text-[11px] font-semibold text-verified">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emergency">
                <AlertTriangle className="h-3.5 w-3.5" /> Water logging
              </div>
              <h3 className="mt-2 text-lg font-semibold leading-snug">
                Waist-deep flooding near Mirpur-10 roundabout after 2hr rainfall
              </h3>
              <p className="bn mt-1.5 text-sm text-muted-foreground">
                মিরপুর-১০ গোলচত্বরে হাঁটু পানি, যান চলাচল প্রায় বন্ধ। বিকল্প রুট ব্যবহার করুন।
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {["3 photos", "1 video", "12 witnesses"].map((t) => (
                  <div
                    key={t}
                    className="rounded-xl border border-border bg-surface px-2 py-2 text-center text-[11px] font-medium text-muted-foreground"
                  >
                    {t}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" /> 4.2k
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> 318
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Share2 className="h-3.5 w-3.5" /> 1.1k
                  </span>
                </div>
                <span>12 min ago</span>
              </div>
            </div>
          </div>

          {/* small floating badge */}
          <div className="card-soft absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-2xl px-3 py-2 sm:flex">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-verified/10 text-verified">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="pr-1 text-xs">
              <div className="font-semibold">Cross-verified</div>
              <div className="text-muted-foreground">by 3 sources</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Pillars -------------------------------- */

const pillars = [
  {
    icon: Siren,
    tone: "emergency",
    title: "Incident Reporting",
    bn: "ঘটনা রিপোর্ট করুন",
    desc: "Photo, video, geo-tagged reports with anonymous options for citizens who need to be heard without being exposed.",
    stat: "৪২k+ reports this month",
    cta: "File a report",
    to: "/complaints" as const,
  },
  {
    icon: Scale,
    tone: "primary",
    title: "Know Your Rights",
    bn: "আপনার অধিকার",
    desc: "Plain-language legal explainers and citizen protections written by lawyers, translated for everyone.",
    stat: "১২০+ rights explained",
    cta: "Read explainers",
    to: "/rights" as const,
  },
  {
    icon: ShieldCheck,
    tone: "verified",
    title: "Fact-check",
    bn: "তথ্য যাচাই",
    desc: "Community and editor verified — misinformation flagged, sources shown, receipts always attached.",
    stat: "98% verification rate",
    cta: "Verify a claim",
    to: "/explore" as const,
  },
  {
    icon: Radio,
    tone: "warning",
    title: "Crisis Alerts",
    bn: "সংকট সতর্কতা",
    desc: "SOS, floods, curfews, road and weather advisories delivered by district, in Bangla and English.",
    stat: "৬৪ districts covered",
    cta: "See live alerts",
    to: "/emergency" as const,
  },
  {
    icon: Users,
    tone: "primary",
    title: "Community",
    bn: "কমিউনিটি",
    desc: "Local circles by district, campus and cause — organize, discuss, and act with neighbours you trust.",
    stat: "৯০০+ active circles",
    cta: "Join a circle",
    to: "/community" as const,
  },
  {
    icon: Landmark,
    tone: "verified",
    title: "Public Info",
    bn: "সরকারি তথ্য",
    desc: "Trusted directories, hotlines, and official notices, updated and cross-checked by public servants.",
    stat: "২.১k official sources",
    cta: "Browse directory",
    to: "/rights" as const,
  },
];

const toneStyles: Record<
  string,
  { chip: string; ring: string; glow: string; bar: string; text: string }
> = {
  emergency: {
    chip: "bg-emergency/10 text-emergency",
    ring: "ring-emergency/40",
    glow: "from-emergency/25 via-emergency/5",
    bar: "bg-emergency",
    text: "text-emergency",
  },
  primary: {
    chip: "bg-primary/10 text-primary",
    ring: "ring-primary/40",
    glow: "from-primary/25 via-primary/5",
    bar: "bg-primary",
    text: "text-primary",
  },
  verified: {
    chip: "bg-verified/10 text-verified",
    ring: "ring-verified/40",
    glow: "from-verified/25 via-verified/5",
    bar: "bg-verified",
    text: "text-verified",
  },
  warning: {
    chip: "bg-warning/20 text-warning-foreground",
    ring: "ring-warning/50",
    glow: "from-warning/25 via-warning/5",
    bar: "bg-warning",
    text: "text-warning-foreground",
  },
};

function PillarGrid() {
  const [active, setActive] = useState(0);
  const [locked, setLocked] = useState(false);
  const total = pillars.length;

  useEffect(() => {
    if (locked) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % total), 4200);
    return () => window.clearInterval(id);
  }, [locked, total]);

  const go = (i: number) => {
    setLocked(true);
    setActive(((i % total) + total) % total);
  };

  const current = pillars[active];
  const tone = toneStyles[current.tone];
  const ActiveIcon = current.icon;

  return (
    <section className="mt-20">
      <SectionHead
        eyebrow="What Protidhwani does"
        title="Six pillars, one civic space"
        bn="ছয় স্তম্ভ, এক নাগরিক প্ল্যাটফর্ম"
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* Featured slide */}
        <div
          key={active}
          className="relative overflow-hidden rounded-[28px] border border-border bg-surface-elevated p-6 sm:p-8"
          style={{ animation: "fade-in 0.45s ease-out" }}
        >
          <div
            aria-hidden
            className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br ${tone.glow} to-transparent blur-3xl transition-all duration-700`}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div
              className={`grid h-14 w-14 place-items-center rounded-2xl ring-1 ${tone.chip} ${tone.ring} transition-transform duration-500`}
              style={{ animation: "scale-in 0.4s ease-out" }}
            >
              <ActiveIcon className="h-6 w-6" />
            </div>
            <div className="text-right">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Pillar {String(active + 1).padStart(2, "0")} / 0{total}
              </div>
              <div className={`bn mt-1 text-xs font-semibold ${tone.text}`}>{current.bn}</div>
            </div>
          </div>

          <h3 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">{current.title}</h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {current.desc}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={current.to}
              className={`tap inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground ${tone.bar} shadow-[0_8px_24px_-10px_currentColor]`}
            >
              {current.cta}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <span className="bn inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${tone.bar}`} />
              {current.stat}
            </span>
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-border/70 pt-5">
            <div className="flex items-center gap-1.5">
              {pillars.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Go to pillar ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === active ? `w-8 ${tone.bar}` : "w-2 bg-border hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => go(active - 1)}
                aria-label="Previous"
                className="tap grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-foreground/70 hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => go(active + 1)}
                aria-label="Next"
                className="tap grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-foreground/70 hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {!locked && (
            <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-border/70">
              <div
                key={`p-${active}`}
                className={`h-full ${tone.bar}`}
                style={{ animation: "pillar-progress 4200ms linear forwards" }}
              />
            </div>
          )}
        </div>

        {/* Thumbnail grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
          {pillars.map((p, i) => {
            const t = toneStyles[p.tone];
            const Icon = p.icon;
            const isActive = i === active;
            return (
              <button
                key={p.title}
                onClick={() => go(i)}
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.25)] active:scale-[0.98] ${
                  isActive
                    ? `border-transparent bg-background ring-2 ${t.ring} shadow-[0_10px_30px_-18px_rgba(0,0,0,0.4)]`
                    : "border-border bg-surface hover:border-transparent hover:ring-1 hover:ring-border"
                }`}
              >
                <span
                  aria-hidden
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.glow} to-transparent opacity-0 transition-opacity duration-500 ${
                    isActive ? "opacity-100" : "group-hover:opacity-60"
                  }`}
                />
                <div className="relative flex items-start gap-3">
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-300 ${t.chip} ${
                      isActive ? "scale-110" : "group-hover:scale-105"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold tracking-tight">{p.title}</div>
                    <div className="bn mt-0.5 truncate text-[11px] text-muted-foreground">{p.bn}</div>
                  </div>
                </div>
                <div
                  className={`relative mt-3 h-0.5 rounded-full ${t.bar} origin-left transition-transform duration-500 ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes pillar-progress {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </section>
  );
}

/* --------------------------- Feed + Trending --------------------------- */

const feed = [
  {
    tag: "Road safety",
    to: "/map" as const,
    tone: "emergency",
    title: "Reckless bus driving on Airport Road — CCTV footage submitted",
    bn: "এয়ারপোর্ট রোডে বেপরোয়া বাসের ভিডিও জমা",
    place: "Uttara · Dhaka",
    time: "6m",
    verified: true,
  },
  {
    tag: "Rights",
    to: "/rights" as const,
    tone: "primary",
    title: "Explainer: What to do if police stop you without a warrant",
    bn: "ওয়ারেন্ট ছাড়া পুলিশ থামালে করণীয়",
    place: "Nationwide",
    time: "1h",
    verified: true,
  },
  {
    tag: "Fact-check",
    to: "/explore" as const,
    tone: "verified",
    title: "Claim about petrol price hike — marked misleading",
    bn: "পেট্রলের দাম বৃদ্ধির দাবি — বিভ্রান্তিকর",
    place: "Verified desk",
    time: "3h",
    verified: true,
  },
  {
    tag: "Flood alert",
    to: "/emergency" as const,
    tone: "warning",
    title: "Rising water in Sylhet lowlands — advisory issued",
    bn: "সিলেটের নিম্নাঞ্চলে পানি বৃদ্ধি",
    place: "Sylhet",
    time: "5h",
    verified: true,
  },
];

function FeedAndTrending() {
  return (
    <section className="mt-20 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <SectionHead
          eyebrow="Civic feed"
          title="Verified voices, in real time"
          bn="প্রকৃত সময়ে যাচাইকৃত কণ্ঠস্বর"
        />
        <div className="mt-6 space-y-3">
          {feed.map((f) => (
            <FeedRow key={f.title} {...f} />
          ))}
        </div>
      </div>
      <aside className="lg:mt-[4.25rem]">
        <div className="card-soft p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Trending across BD
            </h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="mt-4 divide-y divide-border">
            {[
              { t: "#DhakaTraffic", c: "12.3k reports" },
              { t: "#SyllhetFloods", c: "4.1k reports" },
              { t: "#RightToInfo", c: "2.8k signals" },
              { t: "#RoadSafety", c: "9.6k reports" },
              { t: "#PriceHike", c: "3.2k signals" },
            ].map((x, i) => (
              <li key={x.t}>
                <Link
                  to="/explore"
                  className="tap flex items-center justify-between py-3 transition-colors hover:text-primary"
                >
                  <span className="block">
                    <span className="block text-xs text-muted-foreground">Trending · {i + 1}</span>
                    <span className="mt-0.5 block text-sm font-semibold">{x.t}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{x.c}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/explore"
            className="tap mt-3 inline-flex w-full items-center justify-center gap-1 rounded-full border border-border bg-background py-2 text-sm font-medium"
          >
            See all trends <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>
    </section>
  );
}

function FeedRow({
  tag,
  tone,
  title,
  bn,
  place,
  time,
  verified,
  to,
}: {
  tag: string;
  tone: string;
  title: string;
  bn: string;
  place: string;
  time: string;
  verified: boolean;
  to: "/map" | "/rights" | "/explore" | "/emergency";
}) {
  const toneMap: Record<string, string> = {
    emergency: "bg-emergency/10 text-emergency",
    primary: "bg-primary/10 text-primary",
    verified: "bg-verified/10 text-verified",
    warning: "bg-warning/15 text-warning-foreground",
  };
  return (
    <Link
      to={to}
      className="card-soft tap group flex items-start gap-4 p-4 hover:-translate-y-0.5 sm:p-5"
    >
      <div className={`hidden h-11 w-11 shrink-0 place-items-center rounded-2xl sm:grid ${toneMap[tone]}`}>
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
          <span className={`rounded-full px-2 py-0.5 ${toneMap[tone]}`}>{tag}</span>
          {verified && (
            <span className="inline-flex items-center gap-1 text-verified">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </span>
          )}
          <span className="text-muted-foreground">· {place} · {time}</span>
        </div>
        <h3 className="mt-2 text-base font-semibold leading-snug">{title}</h3>
        <p className="bn mt-0.5 text-sm text-muted-foreground">{bn}</p>
        <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> 1.2k
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> 142
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" /> 380
          </span>
        </div>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ---------------------- Verification / Trust band ---------------------- */

function VerificationBand() {
  return (
    <section className="mt-20 overflow-hidden rounded-[32px] border border-border bg-gradient-to-br from-primary to-primary/70 p-8 text-primary-foreground sm:p-12">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5" /> Trust engine
          </div>
          <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
            Every claim, cross-checked.
            <br />
            <span className="bn opacity-90">প্রতিটি তথ্য, যাচাই করা।</span>
          </h2>
          <p className="mt-4 max-w-lg text-primary-foreground/85">
            Reports are triangulated across witnesses, media evidence and trusted editors.
            Misinformation gets flagged — not amplified.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { k: "Witness quorum", v: "3+ verified" },
            { k: "Media proof", v: "Auto EXIF check" },
            { k: "Editor review", v: "< 30 min SLA" },
            { k: "Community trust", v: "Weighted score" },
          ].map((x) => (
            <div
              key={x.k}
              className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 backdrop-blur"
            >
              <div className="text-xs uppercase tracking-wider text-primary-foreground/70">
                {x.k}
              </div>
              <div className="mt-1 text-lg font-semibold">{x.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Emergency strip --------------------------- */

function EmergencyStrip() {
  const hotlines = [
    { name: "National Emergency", num: "999", dial: "999" },
    { name: "Fire Service", num: "102", dial: "102" },
    { name: "Ambulance", num: "১০৫১", dial: "1051" },
    { name: "Women & Child", num: "109", dial: "109" },
    { name: "Anti-corruption", num: "106", dial: "106" },
  ];
  return (
    <section className="mt-20 card-soft overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border/70 bg-emergency/5 px-5 py-3">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-emergency text-emergency-foreground">
          <Siren className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">Emergency hotlines</div>
          <div className="bn text-xs text-muted-foreground">জরুরি হেল্পলাইন</div>
        </div>
        <Link
          to="/emergency"
          className="ml-auto tap inline-flex items-center gap-1 rounded-full bg-emergency px-3 py-1.5 text-xs font-semibold text-emergency-foreground"
        >
          Send SOS
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <ul className="grid divide-border sm:grid-cols-5 sm:divide-x">
        {hotlines.map((h) => (
          <li key={h.name} className="flex items-center justify-between border-b border-border p-4 sm:border-b-0">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {h.name}
              </div>
              <div className="mt-0.5 text-lg font-bold tracking-tight">{h.num}</div>
            </div>
            <a
              href={`tel:${h.dial}`}
              aria-label={`${h.name} — কল করুন / Call ${h.dial}`}
              className="tap grid h-8 w-8 place-items-center rounded-full border border-border"
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ----------------------------- Public info ----------------------------- */

function PublicInfo() {
  const items = [
    { t: "Right to Information Act", d: "How to file an RTI request in 5 steps.", tag: "Guide", to: "/rights" as const },
    { t: "Voter services", d: "NID correction, voter list, polling info.", tag: "Directory", to: "/community" as const },
    { t: "Disaster preparedness", d: "Cyclone, flood & earthquake protocols.", tag: "Safety", to: "/emergency" as const },
  ];
  return (
    <section className="mt-20">
      <SectionHead
        eyebrow="Trusted public information"
        title="Everything a citizen should know"
        bn="একজন নাগরিকের যা জানা দরকার"
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {items.map((i) => (
          <Link
            key={i.t}
            to={i.to}
            className="card-soft tap group flex flex-col p-6 hover:-translate-y-0.5"
          >
            <span className="inline-flex w-fit rounded-full bg-verified/10 px-2 py-0.5 text-[11px] font-semibold text-verified">
              {i.tag}
            </span>
            <h3 className="mt-4 text-lg font-semibold leading-snug">{i.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{i.d}</p>
            <div className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Read guide <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- Bits ---------------------------------- */

function SectionHead({ eyebrow, title, bn }: { eyebrow: string; title: string; bn: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </span>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="bn text-sm text-muted-foreground">{bn}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Protidhwani is an independent, citizen-powered civic network for Bangladesh.
              Built with care, verified with rigor.
            </p>
          </div>
          {[
            {
              h: "Platform",
              l: [
                { x: "Feed", to: "/dashboard" as const },
                { x: "Report", to: "/complaints" as const },
                { x: "Fact-check", to: "/explore" as const },
                { x: "Rights", to: "/rights" as const },
              ],
            },
            {
              h: "About",
              l: [
                { x: "Mission", to: "/about" as const },
                { x: "Editors", to: "/editors" as const },
                { x: "Trust & safety", to: "/trust-safety" as const },
                { x: "Contact", to: "/contact" as const },
              ],
            },

          ].map((c) => (
            <div key={c.h}>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c.h}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {c.l.map((item) => (
                  <li key={item.x}>
                    <Link
                      to={item.to}
                      search={item.to === "/messages" ? {} : undefined}
                      className="text-foreground/80 hover:text-foreground"
                    >
                      {item.x}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} Protidhwani · Made in Bangladesh 🇧🇩</div>
          <div className="bn">সত্য · সাহস · সংহতি</div>
        </div>
      </div>
    </footer>
  );
}
