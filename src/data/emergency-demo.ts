/**
 * Demo emergency layer — SOS + blood alerts that work end to end without the
 * `supabase/emergency.sql` schema applied.
 *
 * `src/services/emergency.ts` falls back here whenever the tables are missing,
 * so the Emergency page always broadcasts, notifies the community and tracks a
 * live location. State is persisted in localStorage and a window event keeps
 * every open surface in sync (the same contract as the social demo layer).
 */

import type { SosAlert, SosKind, SosResponder } from "@/services/emergency";

export const EMERGENCY_DEMO_EVENT = "protidhwani:demo-emergency";
const STORE_KEY = "protidhwani:emergency-demo";

export interface DemoState {
  alerts: SosAlert[];
  seeded: boolean;
}

const DEMO_RESPONDERS: SosResponder[] = [
  { id: "office-999", bn: "৯৯৯ জাতীয় জরুরি সেবা", en: "999 National Emergency", type: "office" },
  { id: "office-police", bn: "থানা কন্ট্রোল রুম", en: "Thana control room", type: "office" },
  { id: "office-ambulance", bn: "অ্যাম্বুলেন্স ডেস্ক", en: "Ambulance desk", type: "office" },
  { id: "vol-ward", bn: "ওয়ার্ড স্বেচ্ছাসেবক দল", en: "Ward volunteer team", type: "volunteer" },
  { id: "vol-blood", bn: "রক্তদাতা নেটওয়ার্ক", en: "Blood donor network", type: "volunteer" },
];

export function demoResponderPool(kind: SosKind): SosResponder[] {
  if (kind === "blood") return DEMO_RESPONDERS.filter((r) => r.id !== "office-police");
  return DEMO_RESPONDERS.filter((r) => r.id !== "vol-blood");
}

function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

function seed(): SosAlert[] {
  return [
    {
      id: "demo-alert-blood-1",
      user_id: "demo-rumana",
      author: { bn: "রুমানা হক", en: "Rumana Haque" },
      kind: "blood",
      status: "responding",
      message: "ঢাকা মেডিকেলে জরুরি ভিত্তিতে O− রক্ত প্রয়োজন · Urgent O− blood needed",
      contact_phone: "01711-000111",
      district: "Dhaka",
      upazila: "Dhanmondi",
      union_name: "Ward 19",
      lat: 23.7461,
      lng: 90.376,
      accuracy_m: 22,
      blood_group: "O−",
      units_needed: 2,
      hospital: "ঢাকা মেডিকেল কলেজ হাসপাতাল · Dhaka Medical College Hospital",
      responders: 4,
      created_at: minutesAgo(12),
      updated_at: minutesAgo(3),
      resolved_at: null,
      is_demo: true,
    },
    {
      id: "demo-alert-sos-1",
      user_id: "demo-tanvir",
      author: { bn: "তানভীর আহমেদ", en: "Tanvir Ahmed" },
      kind: "sos",
      status: "active",
      message: "মিরপুর ১০ গোলচত্বরে ছিনতাইয়ের চেষ্টা · Snatching attempt at Mirpur 10",
      contact_phone: "01822-334455",
      district: "Dhaka",
      upazila: "Mirpur",
      union_name: "Mirpur 10",
      lat: 23.8069,
      lng: 90.3687,
      accuracy_m: 35,
      blood_group: null,
      units_needed: null,
      hospital: null,
      responders: 7,
      created_at: minutesAgo(41),
      updated_at: minutesAgo(30),
      resolved_at: null,
      is_demo: true,
    },
  ];
}

function read(): DemoState {
  if (typeof window === "undefined") return { alerts: seed(), seeded: true };
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    /* ignore corrupt storage */
  }
  const fresh: DemoState = { alerts: seed(), seeded: true };
  write(fresh);
  return fresh;
}

function write(state: DemoState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(EMERGENCY_DEMO_EVENT));
}

export function isDemoAlert(id: string): boolean {
  return id.startsWith("demo-alert-");
}

export function demoListAlerts(): SosAlert[] {
  return read().alerts.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function demoCreateAlert(input: Omit<SosAlert, "id" | "created_at" | "updated_at" | "responders" | "status" | "resolved_at" | "is_demo">): SosAlert {
  const state = read();
  const now = new Date().toISOString();
  const alert: SosAlert = {
    ...input,
    id: `demo-alert-${crypto.randomUUID()}`,
    status: "active",
    responders: 0,
    created_at: now,
    updated_at: now,
    resolved_at: null,
    is_demo: true,
  };
  write({ ...state, alerts: [alert, ...state.alerts] });
  return alert;
}

export function demoUpdateAlert(id: string, patch: Partial<SosAlert>): SosAlert | null {
  const state = read();
  let next: SosAlert | null = null;
  const alerts = state.alerts.map((a) => {
    if (a.id !== id) return a;
    next = { ...a, ...patch, updated_at: new Date().toISOString() };
    return next;
  });
  if (next) write({ ...state, alerts });
  return next;
}

export function demoAddResponder(id: string): SosAlert | null {
  const current = read().alerts.find((a) => a.id === id);
  if (!current) return null;
  return demoUpdateAlert(id, {
    responders: current.responders + 1,
    status: current.status === "active" ? "responding" : current.status,
  });
}

export function subscribeDemoEmergency(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EMERGENCY_DEMO_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EMERGENCY_DEMO_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
