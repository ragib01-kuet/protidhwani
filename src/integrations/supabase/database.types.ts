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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { complaint_status: ComplaintStatus };
    CompositeTypes: Record<string, never>;
  };
}
