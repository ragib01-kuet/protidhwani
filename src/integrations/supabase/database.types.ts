/**
 * Hand-maintained database types for the Protidhwani schema.
 * Regenerate with: supabase gen types typescript --project-id <ref>
 */

export type ComplaintStatus = "open" | "in_progress" | "resolved" | "rejected";
export type VoteValue = 1 | -1;

export interface Profile {
  id: string;
  full_name: string | null;
  full_name_bn: string | null;
  username: string | null;
  phone: string | null;
  district: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_bn: string;
  name_en: string;
  icon: string | null;
  created_at: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string;
  location: string | null;
  district: string | null;
  image_url: string | null;
  status: ComplaintStatus;
  vote_count: number;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  complaint_id: string;
  user_id: string;
  value: VoteValue;
  created_at: string;
}

export interface Comment {
  id: string;
  complaint_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

/** Community feed */
export type CommunityPostKind =
  | "report"
  | "emergency"
  | "verified"
  | "discussion"
  | "rights"
  | "missing"
  | "poll"
  | "event";
export type CommunityPostStatus = "pending" | "verified" | "disputed";
export type CommunityPostLevel = "critical" | "high" | "moderate";

export interface CommunityPost {
  id: string;
  user_id: string;
  kind: CommunityPostKind;
  title: string;
  title_en: string | null;
  body: string;
  body_en: string | null;
  location: string | null;
  district: string | null;
  tags: string[];
  image_urls: string[];
  level: CommunityPostLevel | null;
  status: CommunityPostStatus;
  support_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostSupport {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface PostFlag {
  id: string;
  post_id: string;
  user_id: string;
  reason: string;
  created_at: string;
}

type Row<T> = { Row: T; Insert: Partial<T>; Update: Partial<T>; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      profiles: Row<Profile>;
      categories: Row<Category>;
      complaints: Row<Complaint>;
      votes: Row<Vote>;
      comments: Row<Comment>;
      notifications: Row<Notification>;
      posts: Row<CommunityPost>;
      post_supports: Row<PostSupport>;
      post_comments: Row<PostComment>;
      post_flags: Row<PostFlag>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      complaint_status: ComplaintStatus;
      post_kind: CommunityPostKind;
      post_status: CommunityPostStatus;
      post_level: CommunityPostLevel;
    };
    CompositeTypes: Record<string, never>;
  };
}

