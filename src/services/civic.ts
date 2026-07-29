import { COMPLAINT_BUCKET, supabase } from "@/integrations/supabase/client";
import type {
  Category,
  Comment,
  Complaint,
  Notification,
} from "@/integrations/supabase/database.types";

export type ComplaintWithCategory = Complaint & { categories: Category | null };

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name_en");
  if (error) throw error;
  return data ?? [];
}

export async function listComplaints(): Promise<ComplaintWithCategory[]> {
  const { data, error } = await supabase
    .from("complaints")
    .select("*, categories(*)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as ComplaintWithCategory[];
}

export async function listMyComplaints(userId: string): Promise<ComplaintWithCategory[]> {
  const { data, error } = await supabase
    .from("complaints")
    .select("*, categories(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ComplaintWithCategory[];
}

export interface ComplaintInput {
  title: string;
  description: string;
  category_id: string | null;
  location: string | null;
  district: string | null;
  image_url: string | null;
}

export async function createComplaint(
  userId: string,
  input: ComplaintInput,
): Promise<Complaint> {
  const { data, error } = await supabase
    .from("complaints")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateComplaint(
  id: string,
  input: Partial<ComplaintInput>,
): Promise<Complaint> {
  const { data, error } = await supabase
    .from("complaints")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComplaint(id: string): Promise<void> {
  const { error } = await supabase.from("complaints").delete().eq("id", id);
  if (error) throw error;
}

/** Upload a complaint photo into `complaint-images/<uid>/<file>`. */
export async function uploadComplaintImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(COMPLAINT_BUCKET).upload(path, file);
  if (error) throw error;
  return supabase.storage.from(COMPLAINT_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Upvote / remove upvote. The DB trigger keeps `complaints.vote_count` in sync. */
export async function toggleVote(complaintId: string, userId: string): Promise<"added" | "removed"> {
  const { data: existing, error: readError } = await supabase
    .from("votes")
    .select("id")
    .eq("complaint_id", complaintId)
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw readError;

  if (existing) {
    const { error } = await supabase.from("votes").delete().eq("id", existing.id);
    if (error) throw error;
    return "removed";
  }

  const { error } = await supabase
    .from("votes")
    .insert({ complaint_id: complaintId, user_id: userId, value: 1 });
  if (error) throw error;
  return "added";
}

export async function listMyVotedComplaintIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("votes").select("complaint_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.complaint_id as string);
}

export async function listComments(complaintId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("complaint_id", complaintId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function addComment(
  complaintId: string,
  userId: string,
  body: string,
): Promise<Comment> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ complaint_id: complaintId, user_id: userId, body })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}
