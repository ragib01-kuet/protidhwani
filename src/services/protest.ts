import { supabase } from "@/integrations/supabase/client";
import {
  demoCreateUpdate,
  demoListUpdates,
  demoToggleConfirm,
  isDemoUpdate,
  subscribeDemoProtest,
} from "@/data/protest-demo";

export type ProtestKind = "route" | "crowd" | "announcement" | "firstaid" | "legal";

export interface ProtestUpdate {
  id: string;
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
  verified: boolean;
  confirmations: number;
  created_at: string;
  updated_at: string;
  is_demo?: boolean;
}

export interface NewProtestUpdate {
  kind: ProtestKind;
  title_bn: string;
  title_en: string | null;
  body: string | null;
  place: string | null;
  district: string | null;
  upazila: string | null;
  lat: number | null;
  lng: number | null;
}

export const PROTEST_KINDS: Record<ProtestKind, { bn: string; en: string }> = {
  route: { bn: "নিরাপদ রুট", en: "Safe route" },
  crowd: { bn: "জনসমাগম", en: "Crowd update" },
  announcement: { bn: "ঘোষণা", en: "Announcement" },
  firstaid: { bn: "প্রাথমিক চিকিৎসা", en: "First aid" },
  legal: { bn: "আইনি সহায়তা", en: "Legal help" },
};

/** True when supabase/protest.sql has not been applied yet. */
export function isMissingProtestSchema(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return false;
  if (err.code === "42P01" || err.code === "PGRST205" || err.code === "PGRST200") return true;
  return /relation .*protest_(updates|confirmations).* does not exist|could not find the table/i.test(
    err.message ?? "",
  );
}

const ROW_SELECT =
  "*, profile:profiles!protest_updates_user_id_fkey(full_name, full_name_bn, username)";

type Row = Record<string, unknown> & {
  profile?: { full_name: string | null; full_name_bn: string | null; username: string | null } | null;
};

function mapRow(row: Row): ProtestUpdate {
  const p = row.profile ?? null;
  return {
    ...(row as unknown as ProtestUpdate),
    author: p
      ? {
          bn: p.full_name_bn || p.full_name || p.username || "একজন নাগরিক",
          en: p.full_name || p.username || "A citizen",
        }
      : null,
  };
}

/** Live + demo updates, newest first. District-scoped when known. */
export async function listUpdates(district?: string | null): Promise<ProtestUpdate[]> {
  const demo = demoScoped(district);
  try {
    let query = supabase
      .from("protest_updates")
      .select(ROW_SELECT)
      .order("created_at", { ascending: false })
      .limit(60);
    if (district) query = query.eq("district", district);
    const { data, error } = await query;
    if (error) throw error;
    const live = (data ?? []).map((r) => mapRow(r as Row));
    return [...live, ...demo].sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch (error) {
    if (isMissingProtestSchema(error)) return demo;
    throw error;
  }
}

function demoScoped(district?: string | null): ProtestUpdate[] {
  const all = demoListUpdates();
  if (!district) return all;
  return all.filter((u) => !u.district || u.district === district);
}

export async function postUpdate(
  userId: string | null,
  identity: { bn: string; en: string },
  input: NewProtestUpdate,
): Promise<ProtestUpdate> {
  if (!userId) return demoCreateUpdate({ ...input, user_id: "demo-guest", author: identity });
  try {
    const { data, error } = await supabase
      .from("protest_updates")
      .insert({ ...input, user_id: userId })
      .select(ROW_SELECT)
      .single();
    if (error) throw error;
    return mapRow(data as Row);
  } catch (error) {
    if (isMissingProtestSchema(error)) {
      return demoCreateUpdate({ ...input, user_id: userId, author: identity });
    }
    throw error;
  }
}

/** Which live updates the reader has already confirmed. */
export async function listMyConfirmations(userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  try {
    const { data, error } = await supabase
      .from("protest_confirmations")
      .select("update_id")
      .eq("user_id", userId);
    if (error) throw error;
    return new Set((data ?? []).map((r) => (r as { update_id: string }).update_id));
  } catch (error) {
    if (isMissingProtestSchema(error)) return new Set();
    throw error;
  }
}

/** "আমিও দেখেছি" — three independent confirmations mark an update verified. */
export async function toggleConfirmation(
  update: ProtestUpdate,
  userId: string | null,
  on: boolean,
): Promise<void> {
  if (!userId || update.is_demo || isDemoUpdate(update.id)) {
    demoToggleConfirm(update.id, on);
    return;
  }
  try {
    if (on) {
      const { error } = await supabase
        .from("protest_confirmations")
        .insert({ update_id: update.id, user_id: userId });
      if (error && error.code !== "23505") throw error;
    } else {
      const { error } = await supabase
        .from("protest_confirmations")
        .delete()
        .eq("update_id", update.id)
        .eq("user_id", userId);
      if (error) throw error;
    }
  } catch (error) {
    if (isMissingProtestSchema(error)) {
      demoToggleConfirm(update.id, on);
      return;
    }
    throw error;
  }
}

export function subscribeUpdates(onChange: () => void): () => void {
  const offDemo = subscribeDemoProtest(onChange);
  const channel = supabase
    .channel("protest-updates")
    .on("postgres_changes", { event: "*", schema: "public", table: "protest_updates" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "protest_confirmations" }, onChange)
    .subscribe();
  return () => {
    offDemo();
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------------
// Offline queue — posts written while the device is offline are stored locally
// and flushed automatically when connectivity returns.
// ---------------------------------------------------------------------------

const QUEUE_KEY = "protidhwani:protest-queue";

export interface QueuedUpdate extends NewProtestUpdate {
  queued_at: string;
  local_id: string;
}

export function readQueue(): QueuedUpdate[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? "[]") as QueuedUpdate[];
  } catch {
    return [];
  }
}

function writeQueue(rows: QueuedUpdate[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(rows));
}

export function enqueueUpdate(input: NewProtestUpdate): QueuedUpdate {
  const row: QueuedUpdate = {
    ...input,
    queued_at: new Date().toISOString(),
    local_id: crypto.randomUUID(),
  };
  writeQueue([...readQueue(), row]);
  return row;
}

/** Flush every queued update; returns how many were delivered. */
export async function flushQueue(
  userId: string | null,
  identity: { bn: string; en: string },
): Promise<number> {
  const queue = readQueue();
  if (queue.length === 0) return 0;
  const remaining: QueuedUpdate[] = [];
  let sent = 0;
  for (const item of queue) {
    try {
      const { queued_at: _q, local_id: _l, ...input } = item;
      await postUpdate(userId, identity, input);
      sent += 1;
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return sent;
}
