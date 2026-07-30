import { supabase } from "@/integrations/supabase/client";
import type {
  CommunityPost,
  CommunityPostKind,
  PostComment,
} from "@/integrations/supabase/database.types";

export const COMMUNITY_BUCKET = "community-images";

export interface PostAuthor {
  id: string;
  full_name: string | null;
  full_name_bn: string | null;
  username: string | null;
  avatar_url: string | null;
}

export type PostWithAuthor = CommunityPost & { author: PostAuthor | null };
export type CommentWithAuthor = PostComment & { author: PostAuthor | null };

const AUTHOR_SELECT = "id, full_name, full_name_bn, username, avatar_url";

export type FeedSort = "recent" | "top" | "discussed";

export interface FeedFilters {
  kind?: CommunityPostKind | "all";
  search?: string;
  sort?: FeedSort;
  district?: string | null;
  mine?: string | null;
}

/** Public feed read — works signed-out (RLS: posts readable by everyone). */
export async function listPosts(filters: FeedFilters = {}): Promise<PostWithAuthor[]> {
  let query = supabase
    .from("posts")
    .select(`*, author:profiles!posts_user_id_fkey(${AUTHOR_SELECT})`)
    .limit(60);

  if (filters.kind && filters.kind !== "all") query = query.eq("kind", filters.kind);
  if (filters.district) query = query.eq("district", filters.district);
  if (filters.mine) query = query.eq("user_id", filters.mine);

  const term = filters.search?.trim();
  if (term) {
    const safe = term.replace(/[%,()]/g, " ");
    query = query.or(
      `title.ilike.%${safe}%,title_en.ilike.%${safe}%,body.ilike.%${safe}%,body_en.ilike.%${safe}%,location.ilike.%${safe}%,district.ilike.%${safe}%`,
    );
  }

  if (filters.sort === "top") query = query.order("support_count", { ascending: false });
  else if (filters.sort === "discussed") query = query.order("comment_count", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as PostWithAuthor[];
}

export interface PostInput {
  kind: CommunityPostKind;
  title: string;
  title_en: string | null;
  body: string;
  body_en: string | null;
  location: string | null;
  district: string | null;
  tags: string[];
  image_urls: string[];
  level: CommunityPost["level"];
}

export async function createPost(userId: string, input: PostInput): Promise<CommunityPost> {
  const { data, error } = await supabase
    .from("posts")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as CommunityPost;
}

export async function updatePost(id: string, input: Partial<PostInput>): Promise<CommunityPost> {
  const { data, error } = await supabase
    .from("posts")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as CommunityPost;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

/** Photo/video helpers — media lives in one `image_urls` column. */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv|quicktime)(\?|$)/i;

export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url);
}

/** Turn raw storage errors into actionable bilingual messages. */
function explainStorageError(message: string, isVideo: boolean): string {
  const m = message.toLowerCase();
  if (m.includes("mime") || m.includes("content type") || m.includes("not supported")) {
    return isVideo
      ? "স্টোরেজ বাকেট ভিডিও গ্রহণ করছে না · The community-images bucket does not allow video MIME types. Allow video/mp4, video/webm, video/quicktime (or clear the allowed list) in Storage settings."
      : "স্টোরেজ বাকেট এই ফাইল টাইপ গ্রহণ করছে না · This file type is not allowed by the community-images bucket.";
  }
  if (m.includes("bucket not found")) {
    return "স্টোরেজ বাকেট পাওয়া যায়নি · Storage bucket `community-images` is missing. Create it (public) in Supabase Storage.";
  }
  if (m.includes("exceeded") || m.includes("maximum allowed size")) {
    return "ফাইলটি বাকেটের সাইজ লিমিট ছাড়িয়েছে · File exceeds the bucket's file size limit (raise it to 50 MB for video).";
  }
  return message;
}

export interface MediaUploadProgress {
  /** Index of the file in the array passed to uploadPostMedia. */
  index: number;
  status: "pending" | "uploading" | "done" | "error";
  percent: number;
  url?: string;
  error?: string;
}

/** Upload one file with real progress via the Storage REST endpoint. */
async function uploadOne(
  userId: string,
  file: File,
  token: string,
  onProgress: (percent: number) => void,
): Promise<string> {
  const isVideo = file.type.startsWith("video/");
  const limit = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (file.size > limit) {
    throw new Error(
      isVideo
        ? "ভিডিও ৫০ এমবি-র কম হতে হবে · Video must be under 50 MB"
        : "ছবি ৫ এমবি-র কম হতে হবে · Image must be under 5 MB",
    );
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "jpg");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${baseUrl}/storage/v1/object/${COMMUNITY_BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", apiKey);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "3600");
    if (file.type) xhr.setRequestHeader("content-type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new Error("নেটওয়ার্ক সমস্যা · Network error while uploading"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = `Upload failed (${xhr.status})`;
      try {
        const parsed = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        message = parsed.message ?? parsed.error ?? message;
      } catch {
        /* keep default message */
      }
      reject(new Error(explainStorageError(message, isVideo)));
    };
    xhr.send(file);
  });
  onProgress(100);
  return supabase.storage.from(COMMUNITY_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Upload community photos/videos into `community-images/<uid>/<uuid>.<ext>`.
 * Reports per-file progress. Throws only after attempting every file, so the
 * caller can keep the successful uploads and retry just the failed ones.
 */
export async function uploadPostMedia(
  userId: string,
  files: File[],
  onProgress?: (items: MediaUploadProgress[]) => void,
): Promise<string[]> {
  const items: MediaUploadProgress[] = files.map((_, index) => ({
    index,
    status: "pending",
    percent: 0,
  }));
  const emit = () => onProgress?.(items.map((item) => ({ ...item })));
  emit();

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("লগইন প্রয়োজন · You must be signed in to upload");

  const failures: string[] = [];
  for (let i = 0; i < files.length; i += 1) {
    items[i].status = "uploading";
    emit();
    try {
      const url = await uploadOne(userId, files[i], token, (percent) => {
        items[i].percent = percent;
        emit();
      });
      items[i] = { index: i, status: "done", percent: 100, url };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      items[i] = { index: i, status: "error", percent: 0, error: message };
      failures.push(message);
    }
    emit();
  }

  if (failures.length) throw new Error(failures[0]);
  return items.map((item) => item.url!).filter(Boolean);
}

/** @deprecated use uploadPostMedia */
export const uploadPostImages = uploadPostMedia;

export async function toggleSupport(
  postId: string,
  userId: string,
): Promise<"added" | "removed"> {
  const { data: existing, error: readError } = await supabase
    .from("post_supports")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw readError;

  if (existing) {
    const { error } = await supabase.from("post_supports").delete().eq("id", existing.id);
    if (error) throw error;
    return "removed";
  }
  const { error } = await supabase
    .from("post_supports")
    .insert({ post_id: postId, user_id: userId });
  if (error) throw error;
  return "added";
}

export async function listMySupportedPostIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("post_supports")
    .select("post_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.post_id as string);
}

export async function listPostComments(postId: string): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from("post_comments")
    .select(`*, author:profiles!post_comments_user_id_fkey(${AUTHOR_SELECT})`)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CommentWithAuthor[];
}

export async function addPostComment(
  postId: string,
  userId: string,
  body: string,
): Promise<PostComment> {
  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, user_id: userId, body })
    .select("*")
    .single();
  if (error) throw error;
  return data as PostComment;
}

export async function deletePostComment(id: string): Promise<void> {
  const { error } = await supabase.from("post_comments").delete().eq("id", id);
  if (error) throw error;
}

export async function flagPost(postId: string, userId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from("post_flags")
    .upsert({ post_id: postId, user_id: userId, reason }, { onConflict: "post_id,user_id" });
  if (error) throw error;
}

export async function listMyFlaggedPostIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("post_flags").select("post_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.post_id as string);
}
