/**
 * Demo protest layer — keeps Protest Mode fully functional before
 * `supabase/protest.sql` is applied. Persisted in localStorage and synced
 * across surfaces through a window event (same contract as the other demo
 * layers in this project).
 */

import type { ProtestKind, ProtestUpdate } from "@/services/protest";

export const PROTEST_DEMO_EVENT = "protidhwani:demo-protest";
const STORE_KEY = "protidhwani:protest-demo";

function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

function seed(): ProtestUpdate[] {
  return [
    {
      id: "demo-protest-1",
      user_id: "demo-shahbagh-desk",
      author: { bn: "শাহবাগ স্বেচ্ছাসেবক ডেস্ক", en: "Shahbagh volunteer desk" },
      kind: "route",
      title_bn: "শাহবাগ মোড়ে বিকল্প নিরাপদ রুট খোলা",
      title_en: "Alternate safe route open at Shahbagh",
      body: "কাঁটাবন হয়ে নীলক্ষেত পর্যন্ত হাঁটার পথ পরিষ্কার · Walking path clear via Katabon to Nilkhet",
      place: "শাহবাগ · Shahbagh",
      district: "Dhaka",
      upazila: "Ramna",
      lat: 23.7389,
      lng: 90.3958,
      verified: true,
      confirmations: 6,
      created_at: minutesAgo(2),
      updated_at: minutesAgo(2),
      is_demo: true,
    },
    {
      id: "demo-protest-2",
      user_id: "demo-tsc",
      author: { bn: "টিএসসি মেডিকেল টিম", en: "TSC medical team" },
      kind: "firstaid",
      title_bn: "প্রাথমিক চিকিৎসা কেন্দ্র · টিএসসি",
      title_en: "First aid point at TSC",
      body: "স্যালাইন, ব্যান্ডেজ ও চোখ ধোয়ার ব্যবস্থা আছে · Saline, bandages and eye wash available",
      place: "টিএসসি · TSC",
      district: "Dhaka",
      upazila: "Ramna",
      lat: 23.7333,
      lng: 90.3936,
      verified: true,
      confirmations: 5,
      created_at: minutesAgo(11),
      updated_at: minutesAgo(11),
      is_demo: true,
    },
    {
      id: "demo-protest-3",
      user_id: "demo-coord",
      author: { bn: "সমন্বয় দল", en: "Coordination team" },
      kind: "announcement",
      title_bn: "স্বেচ্ছাসেবক সমন্বয় সভা রাত ৮টা",
      title_en: "Volunteer coordination at 8 PM",
      body: "প্রতিটি ওয়ার্ড থেকে দুজন প্রতিনিধি আসুন · Two representatives from each ward",
      place: "দোয়েল চত্বর · Doel Chattar",
      district: "Dhaka",
      upazila: "Ramna",
      lat: 23.7275,
      lng: 90.4,
      verified: true,
      confirmations: 4,
      created_at: minutesAgo(35),
      updated_at: minutesAgo(35),
      is_demo: true,
    },
    {
      id: "demo-protest-4",
      user_id: "demo-crowd",
      author: { bn: "নাগরিক পর্যবেক্ষক", en: "Citizen observer" },
      kind: "crowd",
      title_bn: "মৎস্য ভবন মোড়ে ভিড় বাড়ছে",
      title_en: "Crowd building near Matsya Bhaban",
      body: "যানবাহন ঘুরিয়ে দেওয়া হচ্ছে · Traffic is being diverted",
      place: "মৎস্য ভবন · Matsya Bhaban",
      district: "Dhaka",
      upazila: "Ramna",
      lat: 23.7355,
      lng: 90.4055,
      verified: false,
      confirmations: 2,
      created_at: minutesAgo(6),
      updated_at: minutesAgo(6),
      is_demo: true,
    },
  ];
}

function read(): ProtestUpdate[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const initial = seed();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as ProtestUpdate[];
  } catch {
    return seed();
  }
}

function write(rows: ProtestUpdate[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(PROTEST_DEMO_EVENT));
}

export function isDemoUpdate(id: string): boolean {
  return id.startsWith("demo-protest");
}

export function demoListUpdates(): ProtestUpdate[] {
  return read().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function demoCreateUpdate(input: {
  user_id: string;
  author: { bn: string; en: string } | null;
  kind: ProtestKind;
  title_bn: string;
  title_en: string | null;
  body: string | null;
  place: string | null;
  district: string | null;
  upazila: string | null;
  lat: number | null;
  lng: number | null;
}): ProtestUpdate {
  const now = new Date().toISOString();
  const row: ProtestUpdate = {
    id: `demo-protest-${crypto.randomUUID()}`,
    verified: false,
    confirmations: 0,
    created_at: now,
    updated_at: now,
    is_demo: true,
    ...input,
  };
  write([row, ...read()]);
  return row;
}

/** Toggle a confirmation for the local reader; auto-verifies at 3. */
export function demoToggleConfirm(id: string, on: boolean): ProtestUpdate | null {
  const rows = read();
  const row = rows.find((r) => r.id === id);
  if (!row) return null;
  row.confirmations = Math.max(0, row.confirmations + (on ? 1 : -1));
  row.verified = row.confirmations >= 3;
  row.updated_at = new Date().toISOString();
  write(rows);
  return row;
}

export function subscribeDemoProtest(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(PROTEST_DEMO_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(PROTEST_DEMO_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
