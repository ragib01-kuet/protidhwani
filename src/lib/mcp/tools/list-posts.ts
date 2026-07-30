import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { errorResult, requireAuth, supabaseForUser, textResult } from "../supabase";

const POST_KINDS = [
  "report",
  "emergency",
  "verified",
  "discussion",
  "rights",
  "missing",
  "poll",
  "event",
] as const;

export default defineTool({
  name: "list_community_posts",
  title: "List community posts",
  description:
    "List posts from the Protidhwani community feed (বাংলা/English), optionally filtered by kind, district or a text search.",
  inputSchema: {
    kind: z.enum(POST_KINDS).optional().describe("Filter by post kind."),
    district: z.string().optional().describe("Filter by district name."),
    search: z.string().optional().describe("Free-text search over title, body and location."),
    mine: z.boolean().optional().describe("Only posts created by the signed-in user."),
    sort: z
      .enum(["recent", "top", "discussed"])
      .optional()
      .describe("Sort order; defaults to recent."),
    limit: z.number().int().optional().describe("Max posts to return (1-50, default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    const userId = requireAuth(ctx);
    if (!userId) return errorResult("Not authenticated");

    const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
    let query = supabaseForUser(ctx)
      .from("posts")
      .select(
        "id, kind, title, title_en, body, body_en, location, district, tags, level, status, support_count, comment_count, created_at",
      )
      .limit(limit);

    if (input.kind) query = query.eq("kind", input.kind);
    if (input.district) query = query.eq("district", input.district);
    if (input.mine) query = query.eq("user_id", userId);

    const term = input.search?.trim();
    if (term) {
      const safe = term.replace(/[%,()]/g, " ");
      query = query.or(
        `title.ilike.%${safe}%,title_en.ilike.%${safe}%,body.ilike.%${safe}%,body_en.ilike.%${safe}%,location.ilike.%${safe}%,district.ilike.%${safe}%`,
      );
    }

    if (input.sort === "top") query = query.order("support_count", { ascending: false });
    else if (input.sort === "discussed") query = query.order("comment_count", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return { ...textResult(data ?? []), structuredContent: { posts: data ?? [] } };
  },
});
