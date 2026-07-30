import { supabase } from "@/integrations/supabase/client";
import {
  demoAddResponder,
  demoCreateAlert,
  demoListAlerts,
  demoResponderPool,
  demoUpdateAlert,
  isDemoAlert,
  subscribeDemoEmergency,
} from "@/data/emergency-demo";

export type SosKind = "sos" | "medical" | "fire" | "police" | "missing" | "blood" | "text";
export type SosStatus = "active" | "responding" | "resolved" | "cancelled";

export interface SosResponder {
  id: string;
  bn: string;
  en: string;
  type: "office" | "volunteer";
}

export interface SosAlert {
  id: string;
  user_id: string;
  author: { bn: string; en: string } | null;
  kind: SosKind;
  status: SosStatus;
  message: string | null;
  contact_phone: string | null;
  district: string | null;
  upazila: string | null;
  union_name: string | null;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  blood_group: string | null;
  units_needed: number | null;
  hospital: string | null;
  responders: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  is_demo?: boolean;
}

export interface NewAlertInput {
  kind: SosKind;
  message: string | null;
  contact_phone: string | null;
  district: string | null;
  upazila: string | null;
  union_name: string | null;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  blood_group?: string | null;
  units_needed?: number | null;
  hospital?: string | null;
}

export const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"] as const;

export const KIND_LABELS: Record<SosKind, { bn: string; en: string; icon: string }> = {
  sos: { bn: "এসওএস", en: "SOS", icon: "🚨" },
  medical: { bn: "মেডিকেল", en: "Medical", icon: "🚑" },
  fire: { bn: "ফায়ার সার্ভিস", en: "Fire", icon: "🔥" },
  police: { bn: "পুলিশ", en: "Police", icon: "🚓" },
  missing: { bn: "নিখোঁজ ব্যক্তি", en: "Missing person", icon: "👤" },
  blood: { bn: "রক্তের ডাক", en: "Blood alert", icon: "🩸" },
  text: { bn: "জরুরি বার্তা", en: "Emergency text", icon: "✉️" },
};

/** True when supabase/emergency.sql has not been applied yet. */
export function isMissingEmergencySchema(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return false;
  if (err.code === "42P01" || err.code === "PGRST205" || err.code === "PGRST200") return true;
  return /relation .*(sos_alerts|sos_pings|sos_responses).* does not exist|could not find the table/i.test(
    err.message ?? "",
  );
}

const ROW_SELECT =
  "*, profile:profiles!sos_alerts_user_id_fkey(full_name, full_name_bn, username)";

type Row = Record<string, unknown> & {
  profile?: { full_name: string | null; full_name_bn: string | null; username: string | null } | null;
};

function mapRow(row: Row): SosAlert {
  const p = row.profile ?? null;
  return {
    ...(row as unknown as SosAlert),
    author: p
      ? {
          bn: p.full_name_bn || p.full_name || p.username || "একজন নাগরিক",
          en: p.full_name || p.username || "A citizen",
        }
      : null,
  };
}

/** Alerts for the reader's community (district scoped when known). */
export async function listAlerts(district?: string | null): Promise<SosAlert[]> {
  try {
    let query = supabase
      .from("sos_alerts")
      .select(ROW_SELECT)
      .order("created_at", { ascending: false })
      .limit(40);
    if (district) query = query.eq("district", district);
    const { data, error } = await query;
    if (error) throw error;
    const live = (data ?? []).map((r) => mapRow(r as Row));
    return [...live, ...demoScoped(district)];
  } catch (error) {
    if (isMissingEmergencySchema(error)) return demoScoped(district);
    throw error;
  }
}

function demoScoped(district?: string | null): SosAlert[] {
  const all = demoListAlerts();
  if (!district) return all;
  return all.filter((a) => !a.district || a.district === district);
}

/** Raise an alert — this is what fans out to the community and the offices. */
export async function raiseAlert(
  userId: string | null,
  identity: { bn: string; en: string },
  input: NewAlertInput,
): Promise<SosAlert> {
  if (!userId) return demoCreateAlert({ ...normalise(input), user_id: "demo-guest", author: identity });
  try {
    const { data, error } = await supabase
      .from("sos_alerts")
      .insert({ ...normalise(input), user_id: userId })
      .select(ROW_SELECT)
      .single();
    if (error) throw error;
    return mapRow(data as Row);
  } catch (error) {
    if (isMissingEmergencySchema(error)) {
      return demoCreateAlert({ ...normalise(input), user_id: userId, author: identity });
    }
    throw error;
  }
}

function normalise(input: NewAlertInput) {
  return {
    kind: input.kind,
    message: input.message,
    contact_phone: input.contact_phone,
    district: input.district,
    upazila: input.upazila,
    union_name: input.union_name,
    lat: input.lat,
    lng: input.lng,
    accuracy_m: input.accuracy_m,
    blood_group: input.blood_group ?? null,
    units_needed: input.units_needed ?? null,
    hospital: input.hospital ?? null,
  };
}

/** Push a live position for an active alert (tracking trail + last known point). */
export async function pushPing(
  alert: SosAlert,
  lat: number,
  lng: number,
  accuracy: number | null,
): Promise<void> {
  if (alert.is_demo || isDemoAlert(alert.id)) {
    demoUpdateAlert(alert.id, { lat, lng, accuracy_m: accuracy });
    return;
  }
  try {
    const { error } = await supabase.from("sos_pings").insert({
      alert_id: alert.id,
      lat,
      lng,
      accuracy_m: accuracy,
    });
    if (error) throw error;
    await supabase
      .from("sos_alerts")
      .update({ lat, lng, accuracy_m: accuracy, updated_at: new Date().toISOString() })
      .eq("id", alert.id);
  } catch (error) {
    if (isMissingEmergencySchema(error)) {
      demoUpdateAlert(alert.id, { lat, lng, accuracy_m: accuracy });
      return;
    }
    throw error;
  }
}

export async function setAlertStatus(alert: SosAlert, status: SosStatus): Promise<SosAlert | null> {
  if (alert.is_demo || isDemoAlert(alert.id)) {
    return demoUpdateAlert(alert.id, {
      status,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    });
  }
  try {
    const { data, error } = await supabase
      .from("sos_alerts")
      .update({
        status,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", alert.id)
      .select(ROW_SELECT)
      .single();
    if (error) throw error;
    return mapRow(data as Row);
  } catch (error) {
    if (isMissingEmergencySchema(error)) {
      return demoUpdateAlert(alert.id, { status });
    }
    throw error;
  }
}

/** "আমি যাচ্ছি" — a neighbour acknowledges an alert. */
export async function respondToAlert(alert: SosAlert, userId: string | null): Promise<void> {
  if (alert.is_demo || isDemoAlert(alert.id) || !userId) {
    demoAddResponder(alert.id);
    return;
  }
  try {
    const { error } = await supabase
      .from("sos_responses")
      .insert({ alert_id: alert.id, user_id: userId });
    if (error && error.code !== "23505") throw error;
    await supabase
      .from("sos_alerts")
      .update({ responders: alert.responders + 1, status: "responding" })
      .eq("id", alert.id);
  } catch (error) {
    if (isMissingEmergencySchema(error)) {
      demoAddResponder(alert.id);
      return;
    }
    throw error;
  }
}

/** Realtime + demo-store subscription in one call. */
export function subscribeAlerts(onChange: () => void): () => void {
  const offDemo = subscribeDemoEmergency(onChange);
  const channel = supabase
    .channel("sos-alerts")
    .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, onChange)
    .subscribe();
  return () => {
    offDemo();
    void supabase.removeChannel(channel);
  };
}

export { demoResponderPool as responderPool };
