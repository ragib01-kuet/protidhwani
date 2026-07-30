import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Droplet, Loader2, MapPin, Phone, Radio, ShieldCheck, Users, WifiOff } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { AlertCard } from "@/components/emergency/AlertCard";
import { BloodAlertModal, type BloodDraft } from "@/components/emergency/BloodAlertModal";
import { SosCountdownModal } from "@/components/emergency/SosCountdownModal";
import { AreaScopeSheet } from "@/components/community/AreaScopeSheet";
import { useAuth } from "@/hooks/useAuth";
import { useAreaScope } from "@/hooks/useAreaScope";
import { useLiveTracking } from "@/hooks/useLiveTracking";
import { scopeLabel } from "@/data/bd-areas";
import { toBnNumber } from "@/lib/community-meta";
import {
  KIND_LABELS,
  listAlerts,
  pushPing,
  raiseAlert,
  respondToAlert,
  responderPool,
  setAlertStatus,
  subscribeAlerts,
  type SosAlert,
  type SosKind,
} from "@/services/emergency";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "জরুরি সহায়তা · Emergency Help — Protidhwani" },
      {
        name: "description",
        content:
          "One-tap SOS and blood alerts that notify your whole community and emergency offices with live location tracking.",
      },
      { property: "og:title", content: "জরুরি সহায়তা · Emergency Help" },
      { property: "og:description", content: "SOS broadcast, blood alerts, live tracking and 999 in one screen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Emergency,
});

interface QuickAction {
  kind: SosKind;
  bn: string;
  en: string;
  icon: string;
  tel?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { kind: "sos", bn: "৯৯৯ কল", en: "Call 999", icon: "📞", tel: "999" },
  { kind: "medical", bn: "মেডিকেল", en: "Medical", icon: "🚑", tel: "16263" },
  { kind: "fire", bn: "ফায়ার সার্ভিস", en: "Fire", icon: "🔥", tel: "16163" },
  { kind: "police", bn: "পুলিশ", en: "Police", icon: "🚓", tel: "999" },
  { kind: "missing", bn: "নিখোঁজ ব্যক্তি", en: "Missing Person", icon: "👤" },
  { kind: "text", bn: "জরুরি বার্তা", en: "Emergency Text", icon: "✉️" },
];

function Emergency() {
  const { user } = useAuth();
  const { scope, setManual, detect, status: geoStatus } = useAreaScope();
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<null | SosKind>(null);
  const [bloodOpen, setBloodOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mine, setMine] = useState<SosAlert | null>(null);
  const [notified, setNotified] = useState<{ bn: string; en: string }[]>([]);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const mineRef = useRef<SosAlert | null>(null);
  mineRef.current = mine;

  const identity = useMemo(
    () => ({
      bn: (user?.user_metadata?.full_name_bn as string) || (user?.user_metadata?.full_name as string) || "একজন নাগরিক",
      en: (user?.user_metadata?.full_name as string) || user?.email || "A citizen",
    }),
    [user],
  );

  const area = scope ? scopeLabel(scope) : { bn: "বাংলাদেশ", en: "Bangladesh" };

  const { fix, status: trackStatus, start, stop, locateOnce } = useLiveTracking((next) => {
    const active = mineRef.current;
    if (active) void pushPing(active, next.lat, next.lng, next.accuracy);
  });

  const load = useCallback(async () => {
    try {
      const rows = await listAlerts(scope?.district ?? null);
      setAlerts(rows);
    } catch (error) {
      toast.error("অ্যালার্ট লোড হয়নি", { description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [scope?.district]);

  useEffect(() => {
    void load();
    return subscribeAlerts(() => void load());
  }, [load]);

  const broadcast = useCallback(
    async (kind: SosKind, extra?: Partial<BloodDraft> & { message?: string }) => {
      setSubmitting(true);
      try {
        const point = fix ?? (await locateOnce());
        const alert = await raiseAlert(user?.id ?? null, identity, {
          kind,
          message:
            extra?.message ??
            (kind === "blood"
              ? `${extra?.group} রক্ত প্রয়োজন · ${extra?.group} blood needed at ${extra?.hospital}`
              : `${KIND_LABELS[kind].bn} · জরুরি সহায়তা প্রয়োজন — ${area.bn}`),
          contact_phone: extra?.phone ?? ((user?.user_metadata?.phone as string) ?? null),
          district: scope?.district ?? null,
          upazila: scope?.upazila ?? null,
          union_name: scope?.union ?? null,
          lat: point?.lat ?? null,
          lng: point?.lng ?? null,
          accuracy_m: point?.accuracy ?? null,
          blood_group: extra?.group ?? null,
          units_needed: extra?.units ?? null,
          hospital: extra?.hospital ?? null,
        });
        setMine(alert);
        setTrackingId(alert.id);
        setNotified(responderPool(kind));
        start();
        await load();
        toast.success(kind === "blood" ? "রক্তের ডাক পাঠানো হয়েছে" : "এসওএস সম্প্রচার হয়েছে", {
          description:
            kind === "blood"
              ? `Blood alert broadcast to ${area.en} · donors & offices notified`
              : `SOS broadcast to ${area.en} · community & emergency offices notified`,
        });
      } catch (error) {
        toast.error("পাঠানো যায়নি · Could not broadcast", { description: (error as Error).message });
      } finally {
        setSubmitting(false);
      }
    },
    [area.bn, area.en, fix, identity, load, locateOnce, scope, start, user],
  );

  const stopTracking = useCallback(async () => {
    const active = mineRef.current;
    stop();
    setTrackingId(null);
    if (active) {
      await setAlertStatus(active, "resolved");
      setMine(null);
      setNotified([]);
      await load();
      toast.success("নিরাপদ হিসেবে চিহ্নিত", { description: "Marked safe · tracking stopped" });
    }
  }, [load, stop]);

  const activeAlerts = alerts.filter((a) => a.status !== "resolved" && a.status !== "cancelled");
  const bloodAlerts = alerts.filter((a) => a.kind === "blood" && a.status !== "resolved");

  return (
    <AppShell title={{ bn: "জরুরি সহায়তা", en: "Emergency Help" }} showSearch={false}>
      {/* area scope — who gets notified */}
      <button
        onClick={() => setScopeOpen(true)}
        data-testid="scope-button"
        className="flex w-full items-center gap-3 rounded-3xl border border-border bg-card px-4 py-3 text-left shadow-card active:scale-[0.99]"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-primary">
          <MapPin className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span lang="bn" className="block truncate text-sm font-bold">{area.bn}</span>
          <span lang="en" className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground">
            {area.en} · community notified on SOS
          </span>
        </span>
        <span lang="bn" className="shrink-0 rounded-full bg-surface px-3 py-1.5 text-[11px] font-bold">
          বদলান
        </span>
      </button>

      {/* SOS */}
      <button
        data-testid="sos-button"
        onClick={() => setCountdown("sos")}
        disabled={submitting}
        className="mt-4 grid w-full place-items-center gap-2 rounded-[2rem] bg-emergency px-6 py-10 text-emergency-foreground shadow-lift transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-70"
      >
        <span className="grid size-20 place-items-center rounded-full bg-emergency-foreground/15 pulse-ring text-3xl">
          {submitting ? <Loader2 className="size-8 animate-spin" /> : "🚨"}
        </span>
        <span lang="bn" className="mt-2 text-3xl font-bold tracking-tight">এসওএস পাঠান</span>
        <span lang="en" className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
          Send SOS · holds location & contacts
        </span>
      </button>

      {/* Blood alert */}
      <button
        data-testid="blood-button"
        onClick={() => setBloodOpen(true)}
        className="mt-3 flex w-full items-center gap-4 rounded-[2rem] border border-emergency/30 bg-emergency-soft px-5 py-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-3xl bg-emergency text-emergency-foreground">
          <Droplet className="size-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span lang="bn" className="block text-xl font-bold text-emergency">রক্তের জরুরি ডাক</span>
          <span lang="en" className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-emergency/70">
            Blood alert · donors nearby get notified
          </span>
        </span>
        {bloodAlerts.length > 0 && (
          <span lang="bn" className="shrink-0 rounded-full bg-emergency px-3 py-1.5 text-[11px] font-bold text-emergency-foreground">
            {toBnNumber(bloodAlerts.length)} সক্রিয়
          </span>
        )}
      </button>

      {/* live tracking panel */}
      {mine && (
        <section
          data-testid="tracking-panel"
          className="mt-4 rounded-[2rem] border border-emergency/40 bg-card p-5 shadow-lift"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emergency-soft text-emergency pulse-ring">
              <Radio className="size-5" />
            </span>
            <span className="min-w-0">
              <span lang="bn" className="block text-sm font-bold">লাইভ লোকেশন শেয়ার হচ্ছে</span>
              <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                Live location sharing · {KIND_LABELS[mine.kind].en}
              </span>
            </span>
          </div>

          <div className="mt-3 grid gap-2 rounded-2xl bg-surface px-4 py-3 text-xs">
            <p className="flex items-center justify-between gap-2">
              <span lang="bn" className="text-muted-foreground">অবস্থান</span>
              <span data-testid="tracking-coords" className="font-mono font-semibold">
                {fix ? `${fix.lat.toFixed(5)}, ${fix.lng.toFixed(5)}` : mine.lat ? `${mine.lat.toFixed(5)}, ${mine.lng?.toFixed(5)}` : "—"}
              </span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span lang="bn" className="text-muted-foreground">নির্ভুলতা · accuracy</span>
              <span className="font-semibold">
                {fix?.accuracy ? `±${Math.round(fix.accuracy)} m` : trackStatus === "denied" ? "লোকেশন বন্ধ" : "—"}
              </span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span lang="bn" className="text-muted-foreground">অবস্থা · status</span>
              <span className="font-semibold capitalize">{trackStatus}</span>
            </p>
          </div>

          <div className="mt-3">
            <p lang="bn" className="text-xs font-bold">যাদের জানানো হয়েছে</p>
            <p lang="en" className="text-[10px] uppercase tracking-wider text-muted-foreground">Notified now</p>
            <ul className="mt-2 space-y-1.5" data-testid="notified-list">
              {notified.map((r) => (
                <li key={r.en} className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-[11px]">
                  <ShieldCheck className="size-3.5 shrink-0 text-primary" />
                  <span lang="bn" className="font-semibold">{r.bn}</span>
                  <span lang="en" className="truncate text-muted-foreground">· {r.en}</span>
                </li>
              ))}
              <li className="flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2 text-[11px] text-primary">
                <Users className="size-3.5 shrink-0" />
                <span lang="bn" className="font-semibold">{area.bn} কমিউনিটির সদস্যরা</span>
                <span lang="en" className="truncate opacity-80">· community members</span>
              </li>
            </ul>
          </div>

          <button
            data-testid="stop-tracking"
            onClick={() => void stopTracking()}
            className="mt-4 w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground active:scale-95"
          >
            <span lang="bn">নিরাপদ আছি · ট্র্যাকিং বন্ধ</span>
            <span lang="en" className="ml-1 text-[10px] uppercase tracking-wider opacity-80">I'm safe</span>
          </button>
        </section>
      )}

      {/* quick actions */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.en}
            data-testid={`quick-${a.en.replace(/\s+/g, "-").toLowerCase()}`}
            onClick={() => {
              if (a.tel) {
                window.location.href = `tel:${a.tel}`;
                void broadcast(a.kind, {
                  message: `${a.bn} — ${area.bn} থেকে জরুরি ডাক · ${a.en} requested from ${area.en}`,
                });
                return;
              }
              setCountdown(a.kind);
            }}
            className="flex min-h-28 flex-col justify-between rounded-3xl border border-border bg-card p-5 text-left shadow-card transition-all hover:-translate-y-1 hover:border-emergency/40 hover:shadow-lift active:scale-95"
          >
            <span className="text-2xl">{a.icon}</span>
            <span className="mt-3 block">
              <span lang="bn" className="block text-base font-bold leading-tight">{a.bn}</span>
              <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">{a.en}</span>
            </span>
          </button>
        ))}
      </div>

      {/* live community alerts */}
      <section className="mt-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 lang="bn" className="text-base font-bold">কমিউনিটির লাইভ অ্যালার্ট</h2>
            <p lang="en" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Live community alerts · {area.en}
            </p>
          </div>
          <span
            data-testid="alert-count"
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-bold",
              activeAlerts.length ? "bg-emergency-soft text-emergency" : "bg-surface text-muted-foreground",
            )}
          >
            <span lang="bn">{toBnNumber(activeAlerts.length)} সক্রিয়</span>
          </span>
        </div>

        <div className="mt-3 space-y-3">
          {loading ? (
            <p className="rounded-3xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
              <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
              <span lang="bn">লোড হচ্ছে…</span>
            </p>
          ) : alerts.length === 0 ? (
            <p className="rounded-3xl border border-border bg-card p-6 text-center">
              <span lang="bn" className="block text-sm font-bold">এখন কোনো সক্রিয় অ্যালার্ট নেই</span>
              <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                No active alerts in your area
              </span>
            </p>
          ) : (
            alerts.map((a) => (
              <AlertCard
                key={a.id}
                alert={a}
                isMine={a.id === mine?.id || (Boolean(user) && a.user_id === user?.id)}
                onTrack={(al) => {
                  setTrackingId(al.id);
                  if (al.lat && al.lng) {
                    window.open(`https://www.google.com/maps?q=${al.lat},${al.lng}`, "_blank", "noopener");
                  } else {
                    toast.message("লোকেশন পাওয়া যায়নি", { description: "No location shared on this alert yet" });
                  }
                }}
                onRespond={async (al) => {
                  await respondToAlert(al, user?.id ?? null);
                  await load();
                  toast.success("সাড়া নিবন্ধিত হয়েছে", { description: "The sender has been notified you're coming" });
                }}
                onResolve={async (al) => {
                  await setAlertStatus(al, "resolved");
                  if (al.id === mine?.id) {
                    stop();
                    setMine(null);
                  }
                  await load();
                  toast.success("সমাধান হিসেবে চিহ্নিত", { description: "Alert marked resolved" });
                }}
              />
            ))
          )}
        </div>
      </section>

      {/* offline queue */}
      <section className="mt-5 rounded-[2rem] border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-warning-soft text-warning">
            <WifiOff className="size-5" />
          </span>
          <span className="min-w-0">
            <span lang="bn" className="block text-sm font-bold">অফলাইন কিউ · স্বয়ংক্রিয় পুনঃপ্রেরণ</span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Offline queue · alerts resend when the network returns
            </span>
          </span>
        </div>
      </section>

      {/* contacts */}
      <section className="mt-5 rounded-[2rem] border border-border bg-card p-5 shadow-card">
        <h2 lang="bn" className="text-base font-bold">জরুরি যোগাযোগ</h2>
        <p lang="en" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Emergency contacts</p>
        <div className="mt-4 space-y-2">
          {[
            { bn: "জাতীয় জরুরি সেবা", en: "National emergency", n: "999" },
            { bn: "নারী ও শিশু সহায়তা", en: "Women & children helpline", n: "109" },
            { bn: "ফায়ার সার্ভিস", en: "Fire service", n: "16163" },
            { bn: "রক্তদাতা হটলাইন", en: "Blood donor hotline", n: "01811-458893" },
          ].map((c) => (
            <a
              key={c.n}
              href={`tel:${c.n.replace(/[^0-9]/g, "")}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-surface px-4 py-3 active:scale-[0.99]"
            >
              <span className="min-w-0">
                <span lang="bn" className="block truncate text-sm font-semibold">{c.bn}</span>
                <span lang="en" className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground">{c.en}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emergency px-3 py-1.5 text-xs font-bold text-emergency-foreground">
                <Phone className="size-3.5" />
                {c.n}
              </span>
            </a>
          ))}
        </div>
      </section>

      <SosCountdownModal
        open={countdown !== null}
        areaLabel={area}
        locating={trackStatus === "locating"}
        onCancel={() => {
          setCountdown(null);
          toast.message("এসওএস বাতিল হয়েছে", { description: "SOS cancelled" });
        }}
        onFire={() => {
          const kind = countdown ?? "sos";
          setCountdown(null);
          void broadcast(kind);
        }}
      />

      <BloodAlertModal
        open={bloodOpen}
        areaLabel={area}
        submitting={submitting}
        onClose={() => setBloodOpen(false)}
        onSubmit={(draft) => {
          setBloodOpen(false);
          void broadcast("blood", draft);
        }}
      />

      <AreaScopeSheet
        open={scopeOpen}
        onOpenChange={setScopeOpen}
        scope={scope}
        status={geoStatus}
        onDetect={detect}
        onSelect={setManual}
      />

      {trackingId && null}
    </AppShell>
  );
}
