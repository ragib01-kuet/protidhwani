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

/** Upload community photos/videos into `community-images/<uid>/<uuid>.<ext>`. */
export async function uploadPostMedia(userId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const isVideo = file.type.startsWith("video/");
    const limit = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
    if (file.size > limit) {
      throw new Error(
        isVideo
          ? "ভিডিও ৫০ এমবি-র কম হতে হবে · Video must be under 50 MB"
          : "ছবি ৫ এমবি-র কম হতে হবে · Image must be under 5 MB",
      );
    }
    const ext =
      file.name.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "jpg");
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(COMMUNITY_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw new Error(explainStorageError(error.message, isVideo));
    urls.push(supabase.storage.from(COMMUNITY_BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return urls;
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
