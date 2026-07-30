import { supabase } from "@/integrations/supabase/client";
import { isMissingSocialSchema, personName, type PersonCard } from "@/services/social";
import {
  demoConversation,
  demoListMessages,
  demoMarkRead,
  demoSendMessage,
  findDemoPerson,
  isDemoPerson,
  subscribeDemo,
} from "@/data/social-demo";

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Thread {
  peer: PersonCard;
  last: DirectMessage;
  unread: number;
}

const PERSON_SELECT = "id, full_name, full_name_bn, username, avatar_url, district";

/** Every message I am party to, newest first (capped for the inbox view). */
export async function listMyMessages(meId: string, limit = 300): Promise<DirectMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${meId},recipient_id.eq.${meId}`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingSocialSchema(error)) return demoListMessages(meId);
    throw error;
  }
  return (data ?? []) as DirectMessage[];
}

/** Inbox: one row per conversation partner with last message + unread count. */
export async function listThreads(meId: string): Promise<Thread[]> {
  const messages = await listMyMessages(meId);
  if (messages.length === 0) return [];

  const byPeer = new Map<string, { last: DirectMessage; unread: number }>();
  for (const m of messages) {
    const peerId = m.sender_id === meId ? m.recipient_id : m.sender_id;
    const entry = byPeer.get(peerId) ?? { last: m, unread: 0 };
    // messages arrive newest-first, so the first seen row is the latest.
    if (new Date(m.created_at) > new Date(entry.last.created_at)) entry.last = m;
    if (m.recipient_id === meId && !m.read_at) entry.unread += 1;
    byPeer.set(peerId, entry);
  }

  const ids = [...byPeer.keys()];
  const people = new Map<string, PersonCard>();
  for (const id of ids) {
    const demo = findDemoPerson(id);
    if (demo) people.set(id, demo);
  }
  const realIds = ids.filter((id) => !isDemoPerson(id));
  if (realIds.length) {
    const { data, error } = await supabase.from("profiles").select(PERSON_SELECT).in("id", realIds);
    if (error) throw error;
    for (const p of (data ?? []) as PersonCard[]) people.set(p.id, p);
  }

  return ids
    .map((id) => {
      const entry = byPeer.get(id)!;
      const peer = people.get(id) ?? {
        id,
        full_name: null,
        full_name_bn: null,
        username: null,
        avatar_url: null,
        district: null,
      };
      return { peer, last: entry.last, unread: entry.unread };
    })
    .sort((a, b) => +new Date(b.last.created_at) - +new Date(a.last.created_at));
}

/** Full conversation with one person, oldest first. */
export async function listConversation(meId: string, peerId: string): Promise<DirectMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${meId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${meId})`,
    )
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) {
    if (isMissingSocialSchema(error)) return demoConversation(meId, peerId);
    throw error;
  }
  return (data ?? []) as DirectMessage[];
}

export async function getPerson(id: string): Promise<PersonCard | null> {
  const demo = findDemoPerson(id);
  if (demo) return demo;
  const { data, error } = await supabase
    .from("profiles")
    .select(PERSON_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as PersonCard) ?? null;
}

export async function sendMessage(
  meId: string,
  peerId: string,
  body: string,
): Promise<DirectMessage> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("বার্তা লিখুন · Write a message first");
  if (trimmed.length > 4000) {
    throw new Error("বার্তা ৪০০০ অক্ষরের কম হতে হবে · Message must be under 4000 characters");
  }
  if (isDemoPerson(peerId)) return demoSendMessage(meId, peerId, trimmed);
  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: meId, recipient_id: peerId, body: trimmed })
    .select("*")
    .single();
  if (error) {
    if (isMissingSocialSchema(error)) return demoSendMessage(meId, peerId, trimmed);
    throw error;
  }
  return data as DirectMessage;
}

/** Mark every unread message from this peer as read. */
export async function markThreadRead(meId: string, peerId: string): Promise<void> {
  if (isDemoPerson(peerId)) {
    demoMarkRead(meId, peerId);
    return;
  }
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", meId)
    .eq("sender_id", peerId)
    .is("read_at", null);
  if (error && !isMissingSocialSchema(error)) throw error;
}

export function unreadTotal(threads: Thread[]): number {
  return threads.reduce((sum, t) => sum + t.unread, 0);
}

export function threadTitle(peer: PersonCard): { bn: string; en: string } {
  return personName(peer);
}

/** Realtime: fires whenever a message I send or receive changes. */
export function subscribeToMessages(meId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`dm-${meId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${meId}` },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages", filter: `sender_id=eq.${meId}` },
      onChange,
    )
    .subscribe();
  const unsubDemo = subscribeDemo(onChange);
  return () => {
    unsubDemo();
    void supabase.removeChannel(channel);
  };
}
