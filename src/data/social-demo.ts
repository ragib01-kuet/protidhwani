/**
 * Demo social layer — friends + direct messages that work end to end without
 * the Supabase social schema applied.
 *
 * The live services (`src/services/social.ts`, `src/services/messages.ts`) fall
 * back to this store whenever `friend_requests` / `messages` are missing, so
 * the Friends and Messages pages always feel like a real social network.
 * State is persisted per signed-in user in localStorage and broadcasts a
 * window event so the realtime subscriptions still refresh the UI.
 */

import type { FriendLink, FriendStatus, PersonCard } from "@/services/social";
import type { DirectMessage } from "@/services/messages";

export const DEMO_EVENT = "protidhwani:demo-social";

export const DEMO_PEOPLE: PersonCard[] = [
  {
    id: "demo-rifat",
    full_name: "Rifat Hasan",
    full_name_bn: "রিফাত হাসান",
    username: "rifat",
    avatar_url: null,
    district: "Dhaka",
  },
  {
    id: "demo-nusrat",
    full_name: "Nusrat Jahan",
    full_name_bn: "নুসরাত জাহান",
    username: "nusrat",
    avatar_url: null,
    district: "Dhaka",
  },
  {
    id: "demo-tanvir",
    full_name: "Tanvir Ahmed",
    full_name_bn: "তানভীর আহমেদ",
    username: "tanvir",
    avatar_url: null,
    district: "Chattogram",
  },
  {
    id: "demo-mim",
    full_name: "Mim Akter",
    full_name_bn: "মীম আক্তার",
    username: "mim",
    avatar_url: null,
    district: "Sylhet",
  },
  {
    id: "demo-sabbir",
    full_name: "Sabbir Rahman",
    full_name_bn: "সাব্বির রহমান",
    username: "sabbir",
    avatar_url: null,
    district: "Khulna",
  },
  {
    id: "demo-farhana",
    full_name: "Farhana Islam",
    full_name_bn: "ফারহানা ইসলাম",
    username: "farhana",
    avatar_url: null,
    district: "Rajshahi",
  },
  {
    id: "demo-jubayer",
    full_name: "Jubayer Alam",
    full_name_bn: "জুবায়ের আলম",
    username: "jubayer",
    avatar_url: null,
    district: "Barishal",
  },
  {
    id: "demo-ruma",
    full_name: "Ruma Begum",
    full_name_bn: "রুমা বেগম",
    username: "ruma",
    avatar_url: null,
    district: "Rangpur",
  },
];

/**
 * Extra demo identities registered by feed datasets (community + civic demos)
 * so tapping any author in a demo post opens a real, messageable profile.
 */
const registry = new Map<string, PersonCard>();

export function registerDemoPeople(people: PersonCard[]): void {
  for (const person of people) registry.set(person.id, person);
}

function synthesizePerson(id: string): PersonCard {
  const slug = id.replace(/^demo-/, "").replace(/[-_]+/g, " ").trim();
  const en = slug.replace(/\b\w/g, (c) => c.toUpperCase()) || "Citizen";
  return {
    id,
    full_name: en,
    full_name_bn: null,
    username: slug.replace(/\s+/g, ""),
    avatar_url: null,
    district: null,
  };
}

export function findDemoPerson(id: string): PersonCard | null {
  const seeded = DEMO_PEOPLE.find((p) => p.id === id);
  if (seeded) return seeded;
  const registered = registry.get(id);
  if (registered) return registered;
  // Any other demo-prefixed author still resolves to a usable profile.
  return id.startsWith("demo-") ? synthesizePerson(id) : null;
}

export function isDemoPerson(id: string): boolean {
  return id.startsWith("demo-");
}

interface DemoState {
  links: FriendLink[];
  messages: DirectMessage[];
}

const cache = new Map<string, DemoState>();

function storageKey(meId: string) {
  return `protidhwani.demo-social.${meId || "guest"}`;
}

function minutesAgo(min: number) {
  return new Date(Date.now() - min * 60_000).toISOString();
}

function link(
  meId: string,
  peerId: string,
  status: FriendStatus,
  direction: "out" | "in",
  ageMin: number,
): FriendLink {
  return {
    id: `demo-link-${peerId}`,
    requester_id: direction === "out" ? meId : peerId,
    addressee_id: direction === "out" ? peerId : meId,
    status,
    created_at: minutesAgo(ageMin + 30),
    updated_at: minutesAgo(ageMin),
  };
}

function seed(meId: string): DemoState {
  const messages: DirectMessage[] = [
    {
      id: "demo-msg-1",
      sender_id: "demo-rifat",
      recipient_id: meId,
      body: "ভাই, মিরপুর ১০ এ আজ রাস্তার আলো ঠিক হয়েছে? · Are the street lights fixed at Mirpur 10?",
      read_at: null,
      created_at: minutesAgo(58),
    },
    {
      id: "demo-msg-2",
      sender_id: meId,
      recipient_id: "demo-rifat",
      body: "দুইটা এখনো নষ্ট। আমি রিপোর্ট করেছি। · Two are still out, I filed a report.",
      read_at: minutesAgo(50),
      created_at: minutesAgo(54),
    },
    {
      id: "demo-msg-3",
      sender_id: "demo-rifat",
      recipient_id: meId,
      body: "ধন্যবাদ! কমিউনিটি পোস্টে সাপোর্ট দিলাম। · Thanks! I supported your community post.",
      read_at: null,
      created_at: minutesAgo(46),
    },
    {
      id: "demo-msg-4",
      sender_id: "demo-nusrat",
      recipient_id: meId,
      body: "আগামীকাল এলাকার নিরাপত্তা মিটিংয়ে আসছেন? · Joining tomorrow's area safety meeting?",
      read_at: null,
      created_at: minutesAgo(12),
    },
  ];

  return {
    links: [
      link(meId, "demo-rifat", "accepted", "out", 240),
      link(meId, "demo-nusrat", "accepted", "in", 300),
      link(meId, "demo-tanvir", "accepted", "out", 720),
      link(meId, "demo-mim", "pending", "in", 20),
      link(meId, "demo-sabbir", "pending", "in", 90),
      link(meId, "demo-farhana", "pending", "out", 35),
    ],
    messages,
  };
}

function load(meId: string): DemoState {
  const cached = cache.get(meId);
  if (cached) return cached;
  let state: DemoState | null = null;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(storageKey(meId));
      if (raw) state = JSON.parse(raw) as DemoState;
    } catch {
      state = null;
    }
  }
  if (!state || !Array.isArray(state.links) || !Array.isArray(state.messages)) {
    state = seed(meId);
  }
  cache.set(meId, state);
  return state;
}

function save(meId: string, state: DemoState) {
  cache.set(meId, state);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(storageKey(meId), JSON.stringify(state));
    } catch {
      /* storage full or blocked — keep the in-memory copy */
    }
    window.dispatchEvent(new CustomEvent(DEMO_EVENT));
  }
}

/** Subscribe to any demo mutation (stands in for Supabase realtime). */
export function subscribeDemo(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(DEMO_EVENT, handler);
  return () => window.removeEventListener(DEMO_EVENT, handler);
}

/* ------------------------------- friends -------------------------------- */

export function demoListLinks(meId: string): FriendLink[] {
  return [...load(meId).links].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
}

export function demoFindLink(meId: string, peerId: string): FriendLink | null {
  return (
    load(meId).links.find(
      (l) =>
        (l.requester_id === meId && l.addressee_id === peerId) ||
        (l.requester_id === peerId && l.addressee_id === meId),
    ) ?? null
  );
}

export function demoSearchPeople(meId: string, term: string): PersonCard[] {
  const q = term.trim().toLowerCase();
  return DEMO_PEOPLE.filter((p) => p.id !== meId).filter((p) => {
    if (!q) return true;
    return [p.full_name, p.full_name_bn, p.username, p.district]
      .filter(Boolean)
      .some((v) => (v as string).toLowerCase().includes(q));
  });
}

export function demoSendFriendRequest(meId: string, peerId: string): FriendLink {
  const state = load(meId);
  const existing = demoFindLink(meId, peerId);
  if (existing) {
    // They already invited me → instant accept, exactly like Facebook.
    existing.status = existing.addressee_id === meId ? "accepted" : "pending";
    existing.updated_at = new Date().toISOString();
    save(meId, state);
    return existing;
  }
  const created = link(meId, peerId, "pending", "out", 0);
  created.id = `demo-link-${peerId}-${Date.now()}`;
  state.links = [created, ...state.links];
  save(meId, state);
  return created;
}

export function demoRespond(
  meId: string,
  id: string,
  status: Extract<FriendStatus, "accepted" | "declined">,
): FriendLink {
  const state = load(meId);
  const found = state.links.find((l) => l.id === id);
  if (!found) throw new Error("অনুরোধ পাওয়া যায়নি · Request not found");
  found.status = status;
  found.updated_at = new Date().toISOString();
  save(meId, state);
  return found;
}

export function demoRemoveLink(meId: string, id: string): void {
  const state = load(meId);
  state.links = state.links.filter((l) => l.id !== id);
  save(meId, state);
}

/* ------------------------------- messages ------------------------------- */

export function demoListMessages(meId: string): DirectMessage[] {
  return [...load(meId).messages].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
  );
}

export function demoConversation(meId: string, peerId: string): DirectMessage[] {
  return load(meId)
    .messages.filter(
      (m) =>
        (m.sender_id === meId && m.recipient_id === peerId) ||
        (m.sender_id === peerId && m.recipient_id === meId),
    )
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
}

const REPLIES = [
  "ঠিক আছে, আমি দেখছি। · Got it, I'm on it.",
  "ধন্যবাদ জানানোর জন্য! · Thanks for letting me know!",
  "আমি এলাকার গ্রুপে জানিয়ে দিচ্ছি। · I'll share this with the area group.",
  "চলুন কাল একসাথে রিপোর্ট করি। · Let's file the report together tomorrow.",
];

export function demoSendMessage(meId: string, peerId: string, body: string): DirectMessage {
  const state = load(meId);
  const msg: DirectMessage = {
    id: `demo-msg-${Date.now()}`,
    sender_id: meId,
    recipient_id: peerId,
    body: body.trim(),
    read_at: null,
    created_at: new Date().toISOString(),
  };
  state.messages = [...state.messages, msg];
  save(meId, state);

  // Canned reply so a demo conversation actually feels alive.
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      const s = load(meId);
      s.messages = [
        ...s.messages,
        {
          id: `demo-msg-${Date.now()}-r`,
          sender_id: peerId,
          recipient_id: meId,
          body: REPLIES[Math.floor(Math.random() * REPLIES.length)],
          read_at: null,
          created_at: new Date().toISOString(),
        },
      ];
      // Their view of my message is now "read".
      s.messages = s.messages.map((m) =>
        m.sender_id === meId && m.recipient_id === peerId && !m.read_at
          ? { ...m, read_at: new Date().toISOString() }
          : m,
      );
      save(meId, s);
    }, 1600);
  }
  return msg;
}

export function demoMarkRead(meId: string, peerId: string): void {
  const state = load(meId);
  let changed = false;
  state.messages = state.messages.map((m) => {
    if (m.recipient_id === meId && m.sender_id === peerId && !m.read_at) {
      changed = true;
      return { ...m, read_at: new Date().toISOString() };
    }
    return m;
  });
  if (changed) save(meId, state);
}
