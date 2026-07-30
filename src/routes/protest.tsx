import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  Loader2,
  MapPin,
  Megaphone,
  Plus,
  Route as RouteIcon,
  Scale,
  Send,
  Stethoscope,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { AreaScopeSheet } from "@/components/community/AreaScopeSheet";
import { useAuth } from "@/hooks/useAuth";
import { useAreaScope } from "@/hooks/useAreaScope";
import { scopeLabel } from "@/data/bd-areas";
import { relativeTime, toBnNumber } from "@/lib/community-meta";
import { cn } from "@/lib/utils";
import {
  PROTEST_KINDS,
  enqueueUpdate,
  flushQueue,
  listMyConfirmations,
  listUpdates,
  postUpdate,
  readQueue,
  subscribeUpdates,
  toggleConfirmation,
  type ProtestKind,
  type ProtestUpdate,
} from "@/services/protest";

export const Route = createFileRoute("/protest")({
  head: () => ({
    meta: [
      { title: "প্রতিবাদ মোড · Protest Mode — Protidhwani" },
      {
        name: "description",
        content:
          "Live safe routes, crowd updates and verified announcements during demonstrations, with an offline queue that sends when you reconnect.",
      },
      { property: "og:title", content: "প্রতিবাদ মোড · Protest Mode" },
      { property: "og:description", content: "Safe routes, crowd updates and verified-only announcements with offline queue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Protest,
});

const KIND_ICON: Record<ProtestKind, typeof RouteIcon> = {
  route: RouteIcon,
  crowd: Users,
  announcement: Megaphone,
  firstaid: Stethoscope,
  legal: Scale,
};

const KIND_ORDER: ProtestKind[] = ["route", "crowd", "announcement", "firstaid", "legal"];

function Protest() {
  const { user } = useAuth();
  const { scope, setManual, detect, clear, accuracyKm, status: geoStatus } = useAreaScope();

  const [updates, setUpdates] = useState<ProtestUpdate[]>([]);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProtestKind | "all">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [queued, setQueued] = useState(0);
  const [online, setOnline] = useState(true);

  const identity = useMemo(
    () => ({
      bn:
        (user?.user_metadata?.full_name_bn as string) ||
        (user?.user_metadata?.full_name as string) ||
        "একজন নাগরিক",
      en: (user?.user_metadata?.full_name as string) || user?.email || "A citizen",
    }),
    [user],
  );

  const area = scope ? scopeLabel(scope) : { bn: "বাংলাদেশ", en: "Bangladesh" };

  const load = useCallback(async () => {
    try {
      const [rows, mine] = await Promise.all([
        listUpdates(scope?.district ?? null),
        listMyConfirmations(user?.id ?? null),
      ]);
      setUpdates(rows);
      setConfirmed(mine);
    } catch (error) {
      toast.error("আপডেট লোড হয়নি · Could not load updates", {
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  }, [scope?.district, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => subscribeUpdates(() => void load()), [load]);

  // Offline queue: track connectivity and flush the moment we are back online.
  useEffect(() => {
    setOnline(navigator.onLine);
    setQueued(readQueue().length);
    const goOnline = async () => {
      setOnline(true);
      const sent = await flushQueue(user?.id ?? null, identity);
      setQueued(readQueue().length);
      if (sent > 0) {
        toast.success(`${toBnNumber(sent)}টি সারিবদ্ধ আপডেট পাঠানো হয়েছে`, {
          description: `${sent} queued update${sent > 1 ? "s" : ""} delivered`,
        });
        void load();
      }
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    if (navigator.onLine) void goOnline();
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [identity, load, user?.id]);

  const visible = useMemo(
    () =>
      updates.filter(
        (u) => (filter === "all" || u.kind === filter) && (!verifiedOnly || u.verified),
      ),
    [updates, filter, verifiedOnly],
  );

  const counts = useMemo(
    () => ({
      route: updates.filter((u) => u.kind === "route").length,
      crowd: updates.filter((u) => u.kind === "crowd").length,
      announcement: updates.filter((u) => u.kind === "announcement").length,
    }),
    [updates],
  );

  const handleConfirm = async (update: ProtestUpdate) => {
    const on = !confirmed.has(update.id);
    setConfirmed((prev) => {
      const next = new Set(prev);
      if (on) next.add(update.id);
      else next.delete(update.id);
      return next;
    });
    setUpdates((prev) =>
      prev.map((u) =>
        u.id === update.id
          ? {
              ...u,
              confirmations: Math.max(0, u.confirmations + (on ? 1 : -1)),
              verified: Math.max(0, u.confirmations + (on ? 1 : -1)) >= 3,
            }
          : u,
      ),
    );
    try {
      await toggleConfirmation(update, user?.id ?? null, on);
      void load();
    } catch (error) {
      toast.error("নিশ্চিতকরণ ব্যর্থ · Confirmation failed", {
        description: (error as Error).message,
      });
      void load();
    }
  };

  const handleSubmit = async (draft: {
    kind: ProtestKind;
    title_bn: string;
    title_en: string;
    body: string;
    place: string;
  }) => {
    const input = {
      kind: draft.kind,
      title_bn: draft.title_bn.trim(),
      title_en: draft.title_en.trim() || null,
      body: draft.body.trim() || null,
      place: draft.place.trim() || null,
      district: scope?.district ?? null,
      upazila: scope?.upazila ?? null,
      lat: null,
      lng: null,
    };
    if (!navigator.onLine) {
      enqueueUpdate(input);
      setQueued(readQueue().length);
      setComposerOpen(false);
      toast("অফলাইন — আপডেট সারিতে রাখা হয়েছে", {
        description: "Offline — update queued and will send when you reconnect",
      });
      return;
    }
    try {
      await postUpdate(user?.id ?? null, identity, input);
      setComposerOpen(false);
      toast.success("আপডেট প্রকাশিত হয়েছে", { description: "Update published to your community" });
      void load();
    } catch (error) {
      enqueueUpdate(input);
      setQueued(readQueue().length);
      setComposerOpen(false);
      toast.error("পাঠানো যায়নি — সারিতে রাখা হলো", {
        description: `Could not send, queued instead · ${(error as Error).message}`,
      });
    }
  };

  return (
    <AppShell title={{ bn: "প্রতিবাদ মোড", en: "Protest Mode" }} showSearch={false} hideComposer>
      <section className="rounded-[2rem] border border-warning/40 bg-card p-6 shadow-card">
        <button
          onClick={() => setVerifiedOnly((v) => !v)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
            verifiedOnly ? "bg-verified/15 text-verified" : "bg-warning-soft text-warning",
          )}
        >
          <span className={cn("size-2 rounded-full", verifiedOnly ? "bg-verified" : "bg-warning")} />
          <span lang="bn">{verifiedOnly ? "কেবল যাচাইকৃত আপডেট" : "সব আপডেট দেখছেন"}</span>
        </button>
        <h2 lang="bn" className="mt-3 text-xl font-bold">নিরাপদ থাকুন, সংগঠিত থাকুন</h2>
        <p lang="en" className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Stay safe, stay organised
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setScopeOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold"
          >
            <MapPin className="size-3.5 text-primary" />
            <span lang="bn">{area.bn}</span>
            <span lang="en" className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {area.en}
            </span>
          </button>
          <Link
            to="/emergency"
            className="inline-flex items-center gap-2 rounded-full bg-emergency px-3 py-2 text-xs font-bold text-emergency-foreground"
          >
            <span lang="bn">জরুরি সহায়তা</span>
            <span lang="en" className="text-[10px] uppercase tracking-wider opacity-80">SOS</span>
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-surface px-4 py-3">
          <WifiOff className={cn("size-4 shrink-0", online ? "text-muted-foreground" : "text-warning")} />
          <span>
            <span lang="bn" className="block text-xs font-bold">
              {online ? "অনলাইন · বার্তা সরাসরি যাচ্ছে" : "অফলাইন বার্তা কিউ সক্রিয়"}
            </span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              {online ? "Online · sending live" : "Offline message queue active"} ·{" "}
              {queued} queued
            </span>
          </span>
        </div>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {([
          { key: "route" as const, bn: "নিরাপদ রুট", en: "Safe routes", icon: RouteIcon, v: counts.route },
          { key: "crowd" as const, bn: "জনসমাগম", en: "Crowd updates", icon: Users, v: counts.crowd },
          { key: "announcement" as const, bn: "ঘোষণা", en: "Announcements", icon: Megaphone, v: counts.announcement },
        ]).map((c) => (
          <button
            key={c.en}
            onClick={() => setFilter((f) => (f === c.key ? "all" : c.key))}
            className={cn(
              "rounded-3xl border bg-card p-5 text-left shadow-card transition-all hover:-translate-y-0.5",
              filter === c.key ? "border-primary ring-2 ring-primary/20" : "border-border",
            )}
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-brand-soft text-primary">
              <c.icon className="size-5" />
            </span>
            <span lang="bn" className="mt-3 block text-2xl font-bold text-primary">{toBnNumber(c.v)}</span>
            <span lang="bn" className="block text-sm font-semibold">{c.bn}</span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">{c.en}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} bn="সব" en="All" />
        {KIND_ORDER.map((k) => (
          <FilterChip
            key={k}
            active={filter === k}
            onClick={() => setFilter(k)}
            bn={PROTEST_KINDS[k].bn}
            en={PROTEST_KINDS[k].en}
          />
        ))}
      </div>

      <section className="mt-5 space-y-3 pb-24">
        {loading ? (
          <div className="grid place-items-center rounded-3xl border border-border bg-card py-14">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <p lang="bn" className="text-sm font-bold">এই ফিল্টারে কোনো আপডেট নেই</p>
            <p lang="en" className="text-xs text-muted-foreground">No updates match this filter yet</p>
          </div>
        ) : (
          visible.map((u) => {
            const Icon = KIND_ICON[u.kind];
            const t = relativeTime(u.created_at);
            const mine = confirmed.has(u.id);
            return (
              <article key={u.id} className="rounded-3xl border border-border bg-card p-5 shadow-card">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold text-primary">
                    <Icon className="size-3.5" />
                    <span lang="bn">{PROTEST_KINDS[u.kind].bn}</span>
                  </span>
                  {u.verified ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-verified">
                      <BadgeCheck className="size-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-warning">
                      Unverified
                    </span>
                  )}
                </div>
                <h3 lang="bn" className="text-base font-bold">{u.title_bn}</h3>
                {u.title_en && (
                  <p lang="en" className="text-xs font-medium text-muted-foreground">{u.title_en}</p>
                )}
                {u.body && <p className="mt-2 text-sm text-foreground/80">{u.body}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  {u.place && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" /> {u.place}
                    </span>
                  )}
                  <span lang="bn">{t.bn}</span>
                  {u.author && <span lang="bn">· {u.author.bn}</span>}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => void handleConfirm(u)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                      mine
                        ? "border-verified bg-verified/10 text-verified"
                        : "border-border text-muted-foreground hover:text-primary",
                    )}
                  >
                    <Check className="size-3.5" />
                    <span lang="bn">{mine ? "নিশ্চিত করেছেন" : "আমিও দেখেছি"}</span>
                  </button>
                  <span className="text-[11px] text-muted-foreground">
                    <span lang="bn">{toBnNumber(u.confirmations)} জন নিশ্চিত করেছেন</span>
                    <span lang="en"> · {u.confirmations} confirmations</span>
                  </span>
                </div>
              </article>
            );
          })
        )}
      </section>

      <button
        onClick={() => setComposerOpen(true)}
        aria-label="নতুন আপডেট / Post update"
        className="fixed bottom-24 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-4 font-bold text-primary-foreground shadow-lg lg:bottom-8"
      >
        <Plus className="size-5" />
        <span lang="bn" className="text-sm">আপডেট দিন</span>
      </button>

      {composerOpen && (
        <UpdateComposer onClose={() => setComposerOpen(false)} onSubmit={handleSubmit} areaBn={area.bn} />
      )}

      <AreaScopeSheet
        open={scopeOpen}
        onOpenChange={setScopeOpen}
        scope={scope}
        status={geoStatus}
        accuracyKm={accuracyKm}
        onDetect={() => void detect()}
        onApply={setManual}
        onClear={clear}
      />
    </AppShell>
  );
}

function FilterChip({
  active,
  onClick,
  bn,
  en,
}: {
  active: boolean;
  onClick: () => void;
  bn: string;
  en: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
      )}
    >
      <span lang="bn">{bn}</span>
      <span lang="en" className="ml-1.5 text-[10px] uppercase tracking-wider opacity-70">{en}</span>
    </button>
  );
}

function UpdateComposer({
  onClose,
  onSubmit,
  areaBn,
}: {
  onClose: () => void;
  onSubmit: (draft: {
    kind: ProtestKind;
    title_bn: string;
    title_en: string;
    body: string;
    place: string;
  }) => Promise<void>;
  areaBn: string;
}) {
  const [kind, setKind] = useState<ProtestKind>("route");
  const [titleBn, setTitleBn] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [body, setBody] = useState("");
  const [place, setPlace] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!titleBn.trim()) {
      toast.error("বাংলা শিরোনাম দিন · Bangla headline required");
      return;
    }
    setSending(true);
    try {
      await onSubmit({ kind, title_bn: titleBn, title_en: titleEn, body, place });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-border bg-card p-6 shadow-xl sm:rounded-[2rem]">
        <div className="flex items-start justify-between">
          <div>
            <h3 lang="bn" className="text-lg font-bold">প্রতিবাদ আপডেট দিন</h3>
            <p lang="en" className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Post a protest update · {areaBn}
            </p>
          </div>
          <button onClick={onClose} aria-label="বন্ধ / Close" className="rounded-full p-2 text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {KIND_ORDER.map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "rounded-full border px-3 py-2 text-xs font-semibold",
                kind === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
              )}
            >
              <span lang="bn">{PROTEST_KINDS[k].bn}</span>
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span lang="bn" className="text-xs font-bold">বাংলা শিরোনাম *</span>
          <input
            value={titleBn}
            onChange={(e) => setTitleBn(e.target.value)}
            placeholder="যেমন: শাহবাগে বিকল্প নিরাপদ রুট"
            className="mt-1 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="mt-3 block">
          <span lang="en" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            English headline
          </span>
          <input
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Alternate safe route at Shahbagh"
            className="mt-1 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="mt-3 block">
          <span lang="bn" className="text-xs font-bold">বিস্তারিত · Details</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="mt-3 block">
          <span lang="bn" className="text-xs font-bold">স্থান · Place</span>
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="শাহবাগ · Shahbagh"
            className="mt-1 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </label>

        <button
          onClick={() => void submit()}
          disabled={sending}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-primary-foreground disabled:opacity-60"
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          <span lang="bn">প্রকাশ করুন</span>
          <span lang="en" className="text-[11px] uppercase tracking-wider opacity-80">Publish</span>
        </button>
      </div>
    </div>
  );
}
