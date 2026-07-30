import { supabase } from "@/integrations/supabase/client";

export type ClaimStatus =
  | "submitted"
  | "reviewing"
  | "needs_more_info"
  | "verified"
  | "misleading"
  | "false"
  | "unverifiable";

export interface ClaimSource {
  id: string;
  claim_id: string;
  user_id: string;
  kind: string;
  label: string | null;
  url: string | null;
  note: string | null;
  created_at: string;
}

export interface ClaimStatusEvent {
  id: string;
  claim_id: string;
  status: ClaimStatus;
  note: string | null;
  actor_label: string | null;
  created_at: string;
}

export interface VerificationClaim {
  id: string;
  user_id: string;
  claim_text: string;
  context: string | null;
  category: string | null;
  district: string | null;
  area: string | null;
  status: ClaimStatus;
  verdict_note: string | null;
  created_at: string;
  updated_at: string;
  claim_sources: ClaimSource[];
  claim_status_events: ClaimStatusEvent[];
}

const SELECT = "*, claim_sources(*), claim_status_events(*)";

function sortClaim(claim: VerificationClaim): VerificationClaim {
  return {
    ...claim,
    claim_sources: [...(claim.claim_sources ?? [])].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    ),
    claim_status_events: [...(claim.claim_status_events ?? [])].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    ),
  };
}

export async function listMyClaims(userId: string): Promise<VerificationClaim[]> {
  const { data, error } = await supabase
    .from("verification_claims")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return ((data ?? []) as unknown as VerificationClaim[]).map(sortClaim);
}

export async function listPublicClaims(): Promise<VerificationClaim[]> {
  const { data, error } = await supabase
    .from("verification_claims")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return ((data ?? []) as unknown as VerificationClaim[]).map(sortClaim);
}

export interface SourceInput {
  kind: string;
  label: string | null;
  url: string | null;
  note: string | null;
}

export interface ClaimInput {
  claim_text: string;
  context: string | null;
  category: string | null;
  district: string | null;
  area: string | null;
  sources: SourceInput[];
}

export async function createClaim(
  userId: string,
  input: ClaimInput,
): Promise<VerificationClaim> {
  const { sources, ...claim } = input;
  const { data, error } = await supabase
    .from("verification_claims")
    .insert({ ...claim, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  const created = data as unknown as VerificationClaim;

  if (sources.length) {
    const { error: sourceError } = await supabase.from("claim_sources").insert(
      sources.map((source) => ({ ...source, claim_id: created.id, user_id: userId })),
    );
    if (sourceError) throw sourceError;
  }

  const { data: full, error: readError } = await supabase
    .from("verification_claims")
    .select(SELECT)
    .eq("id", created.id)
    .single();
  if (readError) throw readError;
  return sortClaim(full as unknown as VerificationClaim);
}

/** Author-added follow-up note on the timeline (e.g. extra evidence). */
export async function addTimelineNote(claimId: string, note: string, status: ClaimStatus) {
  const { error } = await supabase
    .from("claim_status_events")
    .insert({ claim_id: claimId, status, note, actor_label: "Author update" });
  if (error) throw error;
}
