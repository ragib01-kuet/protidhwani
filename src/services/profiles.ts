import { AVATAR_BUCKET, supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/integrations/supabase/database.types";

/** Read the signed-in user's profile. Returns null when the row does not exist yet. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ProfileInput = Pick<
  Profile,
  "full_name" | "full_name_bn" | "username" | "phone" | "district" | "bio" | "avatar_url"
>;

/** Create-or-update the caller's own profile row (RLS: id = auth.uid()). */
export async function upsertProfile(
  userId: string,
  input: Partial<ProfileInput>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...input, updated_at: new Date().toISOString() })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProfile(userId: string): Promise<void> {
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw error;
}

/** Upload an avatar into `avatars/<uid>/<file>` and return its public URL. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}

export interface ProfileStats {
  posts: number;
  supports: number;
  comments: number;
  complaints: number;
}

/** Counts of the user's civic contributions (head-only queries, no rows fetched). */
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const count = async (table: string) => {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (error) throw error;
    return count ?? 0;
  };
  const [posts, supports, comments, complaints] = await Promise.all([
    count("posts"),
    count("post_supports"),
    count("post_comments"),
    count("complaints"),
  ]);
  return { posts, supports, comments, complaints };
}
