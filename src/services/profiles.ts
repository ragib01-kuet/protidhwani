import { AVATAR_BUCKET, supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/integrations/supabase/database.types";
import { COMMUNITY_BUCKET } from "@/services/community";


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

/**
 * Upload an avatar and return its public URL.
 * Prefers the dedicated `avatars` bucket; when that bucket has not been created
 * in the project yet, it transparently falls back to the community bucket so
 * profile photos keep working instead of failing with "Bucket not found".
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const name = `${crypto.randomUUID()}.${ext}`;

  const attempts: Array<{ bucket: string; path: string }> = [
    { bucket: AVATAR_BUCKET, path: `${userId}/${name}` },
    { bucket: COMMUNITY_BUCKET, path: `avatars/${userId}/${name}` },
  ];

  let lastError: unknown = null;
  for (const { bucket, path } of attempts) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (!error) {
      return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    }
    lastError = error;
    if (!/bucket not found/i.test(error.message)) throw error;
  }
  throw lastError;
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
