import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { errorResult, requireAuth, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "comment_on_post",
  title: "Comment on a community post",
  description: "Add a comment to a Protidhwani community post as the signed-in citizen.",
  inputSchema: {
    post_id: z.string().describe("UUID of the post to comment on."),
    body: z.string().describe("Comment text, 1-2000 characters."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ post_id, body }, ctx) => {
    const userId = requireAuth(ctx);
    if (!userId) return errorResult("Not authenticated");

    const text = body.trim();
    if (text.length < 1 || text.length > 2000) {
      return errorResult("Comment must be between 1 and 2000 characters");
    }

    const { data, error } = await supabaseForUser(ctx)
      .from("post_comments")
      .insert({ post_id, user_id: userId, body: text })
      .select("*")
      .single();

    if (error) return errorResult(error.message);
    return { ...textResult(data), structuredContent: { comment: data } };
  },
});
