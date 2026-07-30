import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { errorResult, requireAuth, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "get_community_post",
  title: "Get a community post",
  description: "Read one Protidhwani community post together with its most recent comments.",
  inputSchema: {
    post_id: z.string().describe("UUID of the post."),
    comment_limit: z.number().int().optional().describe("Comments to include (0-50, default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ post_id, comment_limit }, ctx) => {
    if (!requireAuth(ctx)) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);

    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", post_id)
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!post) return errorResult("Post not found");

    const limit = Math.min(Math.max(comment_limit ?? 10, 0), 50);
    let comments: unknown[] = [];
    if (limit > 0) {
      const { data, error: commentError } = await supabase
        .from("post_comments")
        .select("id, body, created_at, user_id")
        .eq("post_id", post_id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (commentError) return errorResult(commentError.message);
      comments = data ?? [];
    }

    return {
      ...textResult({ post, comments }),
      structuredContent: { post, comments },
    };
  },
});
