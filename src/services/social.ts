import { supabase } from "@/integrations/supabase/client";

/** Basic public card for a person — used across search, friends and chat. */
export interface PersonCard {
  id: string;
  full_name: string | null;
  full_name_bn: string | null;
  username: string | null;
  avatar_url: string | null;
  district: string | null;
}

export type FriendStatus = "pending" | "accepted" | "declined" | "blocked";

export interface FriendLink {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendStatus;
  created_at: string;
  updated_at: string;
}

export type LinkState =
  | "none"
  | "friends"
  | "outgoing" // I sent a request, waiting on them
  | "incoming" // they sent me a request
  | "declined";

export interface PersonWithLink extends PersonCard {
  link: FriendLink | null;
  state: LinkState;
}

const PERSON_SELECT = "id, full_name, full_name_bn, username, avatar_url, district";

/** True when the social schema (supabase/social.sql) has not been applied yet. */
export function isMissingSocialSchema(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return false;
  if (err.code === "42P01" || err.code === "PGRST205") return true;
  return /relation .*(friend_requests|messages).* does not exist|could not find the table/i.test(
    err.message ?? "",
  );
}

export function personName(p: PersonCard | null | undefined): { bn: string; en: string } {
  if (!p) return { bn: "অজানা", en: "Unknown" };
  const en = p.full_name ?? (p.username ? `@${p.username}` : "Protidhwani user");
  return { bn: p.full_name_bn ?? en, en };
}

export function stateFor(link: FriendLink | null, meId: string): LinkState {
  if (!link) return "none";
  if (link.status === "accepted") return "friends";
  if (link.status === "declined") return "declined";
  if (link.status === "blocked") return "declined";
  return link.requester_id === meId ? "outgoing" : "incoming";
}

/** Every friend link that touches me, newest first. */
export async function listLinks(meId: string): Promise<FriendLink[]> {
  const { data, error } = await supabase
    .from("friend_requests")
    .select("*")
    .or(`requester_id.eq.${meId},addressee_id.eq.${meId}`)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FriendLink[];
}

async function peopleByIds(ids: string[]): Promise<Map<string, PersonCard>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase.from("profiles").select(PERSON_SELECT).in("id", ids);
  if (error) throw error;
  return new Map(((data ?? []) as PersonCard[]).map((p) => [p.id, p]));
}

export interface SocialGraph {
  friends: PersonWithLink[];
  incoming: PersonWithLink[];
  outgoing: PersonWithLink[];
  /** peerId → link, for fast lookups in search results. */
  byPeer: Map<string, FriendLink>;
}

/** One round-trip view of my whole social graph. */
export async function getSocialGraph(meId: string): Promise<SocialGraph> {
  const links = await listLinks(meId);
  const peerIds = links.map((l) => (l.requester_id === meId ? l.addressee_id : l.requester_id));
  const people = await peopleByIds([...new Set(peerIds)]);

  const friends: PersonWithLink[] = [];
  const incoming: PersonWithLink[] = [];
  const outgoing: PersonWithLink[] = [];
  const byPeer = new Map<string, FriendLink>();

  for (const link of links) {
    const peerId = link.requester_id === meId ? link.addressee_id : link.requester_id;
    byPeer.set(peerId, link);
    const person = people.get(peerId);
    if (!person) continue;
    const state = stateFor(link, meId);
    const entry: PersonWithLink = { ...person, link, state };
    if (state === "friends") friends.push(entry);
    else if (state === "incoming") incoming.push(entry);
    else if (state === "outgoing") outgoing.push(entry);
  }

  return { friends, incoming, outgoing, byPeer };
}

/** People search by name (bn/en), username or district — excludes me. */
export async function searchPeople(meId: string, term: string): Promise<PersonCard[]> {
  const safe = term.trim().replace(/[%,()]/g, " ");
  let query = supabase.from("profiles").select(PERSON_SELECT).neq("id", meId).limit(30);
  if (safe) {
    query = query.or(
      `full_name.ilike.%${safe}%,full_name_bn.ilike.%${safe}%,username.ilike.%${safe}%,district.ilike.%${safe}%`,
    );
  }
  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PersonCard[];
}

/** Send (or re-send after a decline) a friend request. */
export async function sendFriendRequest(meId: string, peerId: string): Promise<FriendLink> {
  // Accept instantly when they already invited me — Facebook behaviour.
  const existing = await findLink(meId, peerId);
  if (existing) {
    if (existing.status === "accepted") return existing;
    if (existing.addressee_id === meId) return respondToRequest(existing.id, "accepted");
    return updateLink(existing.id, "pending");
  }
  const { data, error } = await supabase
    .from("friend_requests")
    .insert({ requester_id: meId, addressee_id: peerId, status: "pending" })
    .select("*")
    .single();
  if (error) throw error;
  return data as FriendLink;
}

export async function findLink(meId: string, peerId: string): Promise<FriendLink | null> {
  const { data, error } = await supabase
    .from("friend_requests")
    .select("*")
    .or(
      `and(requester_id.eq.${meId},addressee_id.eq.${peerId}),and(requester_id.eq.${peerId},addressee_id.eq.${meId})`,
    )
    .maybeSingle();
  if (error) throw error;
  return (data as FriendLink) ?? null;
}

async function updateLink(id: string, status: FriendStatus): Promise<FriendLink> {
  const { data, error } = await supabase
    .from("friend_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as FriendLink;
}

/** Accept or decline an incoming request. */
export async function respondToRequest(
  id: string,
  status: Extract<FriendStatus, "accepted" | "declined">,
): Promise<FriendLink> {
  return updateLink(id, status);
}

/** Cancel my outgoing request, or unfriend an existing friend. */
export async function removeLink(id: string): Promise<void> {
  const { error } = await supabase.from("friend_requests").delete().eq("id", id);
  if (error) throw error;
}

/** Live updates whenever any friend link that touches me changes. */
export function subscribeToFriendLinks(meId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`friend-links-${meId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "friend_requests", filter: `requester_id=eq.${meId}` },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "friend_requests", filter: `addressee_id=eq.${meId}` },
      onChange,
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
