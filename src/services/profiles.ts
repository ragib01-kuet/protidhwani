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
 * Uses XHR against the Storage REST endpoint so we can report real upload
 * progress. Prefers the dedicated `avatars` bucket and falls back to the
 * community bucket when it does not exist. Every object path starts with the
 * user id so the storage RLS policies (`foldername(name)[1] = auth.uid()`)
 * accept the write.
 */
export async function uploadAvatar(
  userId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const name = `${crypto.randomUUID()}.${ext}`;

  const attempts: Array<{ bucket: string; path: string }> = [
    { bucket: AVATAR_BUCKET, path: `${userId}/${name}` },
    { bucket: COMMUNITY_BUCKET, path: `${userId}/avatars/${name}` },
  ];

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("লগইন প্রয়োজন · You must be signed in to upload");

  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  let lastError: unknown = null;
  for (const { bucket, path } of attempts) {
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${baseUrl}/storage/v1/object/${bucket}/${path}`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("apikey", apiKey);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.setRequestHeader("cache-control", "3600");
        if (file.type) xhr.setRequestHeader("content-type", file.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress?.(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onerror = () =>
          reject(new Error("নেটওয়ার্ক সমস্যা · Network error while uploading"));
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) return resolve();
          let message = `Upload failed (${xhr.status})`;
          try {
            const parsed = JSON.parse(xhr.responseText) as { message?: string; error?: string };
            message = parsed.message ?? parsed.error ?? message;
          } catch {
            /* keep default message */
          }
          reject(new Error(message));
        };
        xhr.send(file);
      });
      onProgress?.(100);
      return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!/bucket not found/i.test(message)) throw error;
      onProgress?.(0);
    }
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
