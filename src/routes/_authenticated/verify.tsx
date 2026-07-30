import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  CircleAlert,
  CircleHelp,
  Crosshair,
  Link2,
  Loader2,
  Plus,
  Search,
  Send,
  ShieldQuestion,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { BiText } from "@/components/BiText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resolveNearestArea } from "@/data/bd-areas";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  createClaim,
  listMyClaims,
  listPublicClaims,
  type ClaimStatus,
  type SourceInput,
  type VerificationClaim,
} from "@/services/verify";

export const Route = createFileRoute("/_authenticated/verify")({
  head: () => ({
    meta: [
      { title: "তথ্য যাচাই Verify information — Protidhwani" },
      {
        name: "description",
        content:
          "Submit a claim, attach sources and follow a transparent status timeline as Protidhwani's community desk verifies it.",
      },
      { property: "og:title", content: "তথ্য যাচাই Verify information — Protidhwani" },
      {
        property: "og:description",
        content: "Claim in, sources attached, verdict tracked step by step.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyPage,
});

const STATUS_META: Record<
  ClaimStatus,
  { bn: string; en: string; tone: string; Icon: typeof BadgeCheck }
> = {
  submitted: {
    bn: "জমা হয়েছে",
    en: "Submitted",
    tone: "border-border bg-muted/50 text-muted-foreground",
    Icon: Send,
  },
  reviewing: {
    bn: "যাচাই চলছে",
    en: "Under review",
    tone: "border-amber-400/40 bg-amber-400/10 text-amber-600",
    Icon: Loader2,
  },
  needs_more_info: {
    bn: "আরও তথ্য দরকার",
    en: "Needs more info",
    tone: "border-amber-400/40 bg-amber-400/10 text-amber-600",
    Icon: CircleHelp,
  },
  verified: {
    bn: "যাচাইকৃত",
    en: "Verified true",
    tone: "border-blue-500/40 bg-blue-500/10 text-blue-600",
    Icon: BadgeCheck,
  },
  misleading: {
    bn: "বিভ্রান্তিকর",
    en: "Misleading",
    tone: "border-amber-500/40 bg-amber-500/10 text-amber-700",
    Icon: CircleAlert,
  },
  false: {
    bn: "মিথ্যা",
    en: "False",
    tone: "border-red-500/40 bg-red-500/10 text-red-600",
    Icon: XCircle,
  },
  unverifiable: {
    bn: "যাচাই অসম্ভব",
    en: "Unverifiable",
    tone: "border-border bg-muted/50 text-muted-foreground",
    Icon: ShieldQuestion,
  },
};

const CATEGORIES = [
  { key: "news", bn: "সংবাদ", en: "News" },
  { key: "photo", bn: "ছবি/ভিডিও", en: "Photo / Video" },
  { key: "rumour", bn: "গুজব", en: "Rumour" },
  { key: "health", bn: "স্বাস্থ্য", en: "Health" },
  { key: "politics", bn: "রাজনীতি", en: "Politics" },
  { key: "scam", bn: "প্রতারণা", en: "Scam" },
];

const SOURCE_KINDS = [
  { key: "link", bn: "লিংক", en: "Link" },
  { key: "image", bn: "ছবি", en: "Image" },
  { key: "document", bn: "নথি", en: "Document" },
  { key: "witness", bn: "সাক্ষী", en: "Witness" },
];

interface DraftSource extends SourceInput {
  key: string;
}

function newSource(): DraftSource {
  return {
    key: Math.random().toString(36).slice(2),
    kind: "link",
    label: "",
    url: "",
    note: "",
  };
}

function StatusBadge({ status }: { status: ClaimStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        meta.tone,
      )}
    >
      <Icon className="size-3.5" />
      <span lang="bn">{meta.bn}</span>
      <span className="opacity-70">{meta.en}</span>
    </span>
  );
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ClaimCard({ claim }: { claim: VerificationClaim }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p lang="bn" className="min-w-0 flex-1 text-base font-semibold leading-snug">
          {claim.claim_text}
        </p>
        <StatusBadge status={claim.status} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatWhen(claim.created_at)}
        {claim.district ? ` · ${[claim.area, claim.district].filter(Boolean).join(", ")}` : ""}
        {` · REF ${claim.id.slice(0, 8).toUpperCase()}`}
      </p>
      {claim.context ? (
        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{claim.context}</p>
      ) : null}

      {claim.claim_sources.length ? (
        <ul className="mt-4 space-y-2">
          {claim.claim_sources.map((source) => (
            <li
              key={source.id}
              className="flex items-start gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm"
            >
              <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate font-medium">{source.label || source.url || source.kind}</p>
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block truncate text-xs text-primary underline-offset-2 hover:underline"
                  >
                    {source.url}
                  </a>
                ) : null}
                {source.note ? (
                  <p className="text-xs text-muted-foreground">{source.note}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-primary"
      >
        {open ? "টাইমলাইন লুকান · Hide timeline" : "স্ট্যাটাস টাইমলাইন · Status timeline"}
      </button>

      {open ? (
        <ol className="mt-4 space-y-4 border-l border-dashed border-border pl-5">
          {claim.claim_status_events.map((event) => {
            const meta = STATUS_META[event.status];
            const Icon = meta.Icon;
            return (
              <li key={event.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[30px] grid size-6 place-items-center rounded-full border bg-background",
                    meta.tone,
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <BiText bn={meta.bn} en={meta.en} className="text-sm" />
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatWhen(event.created_at)}
                  {event.actor_label ? ` · ${event.actor_label}` : ""}
                </p>
                {event.note ? <p className="mt-1 text-sm">{event.note}</p> : null}
              </li>
            );
          })}
        </ol>
      ) : null}
    </article>
  );
}

function VerifyPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"submit" | "mine" | "desk">("submit");
  const [claimText, setClaimText] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [place, setPlace] = useState("");
  const [geoDistrict, setGeoDistrict] = useState<string | null>(null);
  const [geoArea, setGeoArea] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [sources, setSources] = useState<DraftSource[]>([newSource()]);
  const [reference, setReference] = useState<string | null>(null);

  const myClaims = useQuery({
    queryKey: ["claims", "mine", userId],
    queryFn: () => listMyClaims(userId),
    enabled: Boolean(userId),
  });
  const deskClaims = useQuery({
    queryKey: ["claims", "public"],
    queryFn: listPublicClaims,
    enabled: tab === "desk",
  });

  const cleanSources = useMemo(
    () =>
      sources
        .filter((source) => (source.url ?? "").trim() || (source.note ?? "").trim() || (source.label ?? "").trim())
        .map((source) => ({
          kind: source.kind,
          label: (source.label ?? "").trim() || null,
          url: (source.url ?? "").trim() || null,
          note: (source.note ?? "").trim() || null,
        })),
    [sources],
  );

  function detectLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("এই ডিভাইসে লোকেশন নেই · Location unavailable on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const near = resolveNearestArea(position.coords.latitude, position.coords.longitude);
        setGeoDistrict(near?.district.en ?? null);
        setGeoArea(near?.union.en ?? null);
        setPlace([near?.union.en, near?.district.en].filter(Boolean).join(", "));
        setLocating(false);
        toast.success("এলাকা যুক্ত হয়েছে · Area attached");
      },
      () => {
        setLocating(false);
        toast.error("লোকেশন পাওয়া যায়নি — এলাকা লিখুন · Location denied, type the area");
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  const submit = useMutation({
    mutationFn: () =>
      createClaim(userId, {
        claim_text: claimText.trim(),
        context: context.trim() || null,
        category,
        district: geoDistrict ?? (place.trim() || null),
        area: geoArea,
        sources: cleanSources,
      }),
    onSuccess: (claim) => {
      setReference(claim.id);
      void queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  function resetForm() {
    setClaimText("");
    setContext("");
    setCategory(null);
    setPlace("");
    setGeoArea(null);
    setGeoDistrict(null);
    setSources([newSource()]);
    setReference(null);
  }

  const valid = claimText.trim().length >= 10 && cleanSources.length > 0;

  return (
    <AppShell title={{ bn: "তথ্য যাচাই", en: "Verify information" }} hideComposer showBack>
      <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-1.5">
        {(
          [
            { key: "submit", bn: "দাবি জমা", en: "Submit" },
            { key: "mine", bn: "আমার দাবি", en: "My claims" },
            { key: "desk", bn: "যাচাই ডেস্ক", en: "Desk" },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={tab === item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              "rounded-xl px-3 py-2 text-center text-xs transition-colors",
              tab === item.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span lang="bn" className="block text-sm font-semibold">
              {item.bn}
            </span>
            <span className="block text-[10px] uppercase tracking-[0.1em] opacity-80">
              {item.en}
            </span>
          </button>
        ))}
      </div>

      {tab === "submit" && reference ? (
        <section className="rounded-3xl border border-border bg-card p-6 text-center shadow-card">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BadgeCheck className="size-7" />
          </span>
          <BiText
            as="h2"
            bn="দাবি যাচাইয়ের সারিতে গেছে"
            en="Your claim is queued for verification"
            className="mt-4 text-xl"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            <span lang="bn" className="block">
              যাচাই ডেস্ক প্রতিটি ধাপ টাইমলাইনে জানাবে।
            </span>
            <span lang="en" className="block text-xs">
              The desk posts every step to your status timeline.
            </span>
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-2 font-mono text-xs">
            <span className="uppercase tracking-widest text-muted-foreground">Ref</span>
            {reference.slice(0, 8).toUpperCase()}
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                resetForm();
                setTab("mine");
              }}
            >
              টাইমলাইন দেখুন · View timeline
            </Button>
            <Button className="rounded-2xl" onClick={resetForm}>
              আরেকটি দাবি · Submit another
            </Button>
          </div>
        </section>
      ) : null}

      {tab === "submit" && !reference ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid) {
              toast.error(
                "দাবি ও অন্তত একটি সূত্র দিন · Add the claim and at least one source",
              );
              return;
            }
            submit.mutate();
          }}
        >
          <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <BiText bn="কোন তথ্য যাচাই করতে চান?" en="What should we verify?" className="text-lg" />
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="claim-text">দাবি · Claim</Label>
                <Textarea
                  id="claim-text"
                  value={claimText}
                  rows={3}
                  maxLength={600}
                  onChange={(event) => setClaimText(event.target.value)}
                  placeholder="যে দাবিটি ছড়াচ্ছে, হুবহু লিখুন · Write the circulating claim exactly"
                  className="mt-1.5 rounded-2xl"
                />
              </div>
              <div>
                <Label htmlFor="claim-context">প্রেক্ষাপট · Context</Label>
                <Textarea
                  id="claim-context"
                  value={context}
                  rows={3}
                  maxLength={2000}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder="কোথায় দেখলেন, কারা ছড়াচ্ছে · Where you saw it and who is sharing"
                  className="mt-1.5 rounded-2xl"
                />
              </div>
              <div>
                <Label>ধরন · Category</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      aria-pressed={category === item.key}
                      onClick={() => setCategory(category === item.key ? null : item.key)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition-colors",
                        category === item.key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span lang="bn" className="font-semibold">
                        {item.bn}
                      </span>{" "}
                      <span className="opacity-70">{item.en}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="claim-place">এলাকা · Area</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="claim-place"
                    value={place}
                    onChange={(event) => {
                      setPlace(event.target.value);
                      setGeoArea(null);
                      setGeoDistrict(null);
                    }}
                    placeholder="জেলা / উপজেলা · District or upazila"
                    className="rounded-2xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 rounded-2xl"
                    onClick={detectLocation}
                    disabled={locating}
                  >
                    {locating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Crosshair className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <BiText bn="সূত্র যুক্ত করুন" en="Attach sources" className="text-lg" />
            <p className="mt-1 text-xs text-muted-foreground">
              অন্তত একটি সূত্র দিন · At least one source is required
            </p>
            <div className="mt-4 space-y-3">
              {sources.map((source, index) => (
                <div key={source.key} className="rounded-2xl border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {SOURCE_KINDS.map((kind) => (
                      <button
                        key={kind.key}
                        type="button"
                        aria-pressed={source.kind === kind.key}
                        onClick={() =>
                          setSources((list) =>
                            list.map((item, i) =>
                              i === index ? { ...item, kind: kind.key } : item,
                            ),
                          )
                        }
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                          source.kind === kind.key
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        <span lang="bn" className="font-semibold">
                          {kind.bn}
                        </span>{" "}
                        <span className="opacity-70">{kind.en}</span>
                      </button>
                    ))}
                    {sources.length > 1 ? (
                      <button
                        type="button"
                        aria-label="সূত্র সরান / Remove source"
                        onClick={() =>
                          setSources((list) => list.filter((_, i) => i !== index))
                        }
                        className="ml-auto grid size-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                  <Input
                    value={source.label ?? ""}
                    onChange={(event) =>
                      setSources((list) =>
                        list.map((item, i) =>
                          i === index ? { ...item, label: event.target.value } : item,
                        ),
                      )
                    }
                    placeholder="সূত্রের নাম · Source name"
                    className="mt-3 rounded-2xl"
                  />
                  <Input
                    value={source.url ?? ""}
                    inputMode="url"
                    onChange={(event) =>
                      setSources((list) =>
                        list.map((item, i) =>
                          i === index ? { ...item, url: event.target.value } : item,
                        ),
                      )
                    }
                    placeholder="https://…"
                    className="mt-2 rounded-2xl"
                  />
                  <Input
                    value={source.note ?? ""}
                    onChange={(event) =>
                      setSources((list) =>
                        list.map((item, i) =>
                          i === index ? { ...item, note: event.target.value } : item,
                        ),
                      )
                    }
                    placeholder="নোট · Note (optional)"
                    className="mt-2 rounded-2xl"
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full rounded-2xl"
              onClick={() => setSources((list) => [...list, newSource()])}
            >
              <Plus className="mr-1.5 size-4" />
              আরেকটি সূত্র · Add source
            </Button>
          </section>

          <Button
            type="submit"
            className="w-full rounded-2xl"
            disabled={!valid || submit.isPending}
          >
            {submit.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            যাচাইয়ের জন্য পাঠান · Send for verification
          </Button>
        </form>
      ) : null}

      {tab === "mine" ? (
        <div className="space-y-4">
          {myClaims.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto size-5 animate-spin" />
            </p>
          ) : myClaims.data?.length ? (
            myClaims.data.map((claim) => <ClaimCard key={claim.id} claim={claim} />)
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center">
              <Search className="mx-auto size-6 text-muted-foreground" />
              <BiText
                bn="এখনো কোনো দাবি জমা দেননি"
                en="You have not submitted a claim yet"
                className="mt-3 text-sm"
              />
            </div>
          )}
        </div>
      ) : null}

      {tab === "desk" ? (
        <div className="space-y-4">
          {deskClaims.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto size-5 animate-spin" />
            </p>
          ) : deskClaims.data?.length ? (
            deskClaims.data.map((claim) => <ClaimCard key={claim.id} claim={claim} />)
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center">
              <BiText
                bn="ডেস্কে এখনো কিছু নেই"
                en="Nothing on the desk yet"
                className="text-sm"
              />
            </div>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}
