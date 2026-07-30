import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { errorResult, requireAuth, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "support_post",
  title: "Support or unsupport a post",
  description:
    "Add or remove the signed-in citizen's support (upvote) on a Protidhwani community post.",
  inputSchema: {
    post_id: z.string().describe("UUID of the post."),
    supported: z.boolean().describe("true to support, false to remove support."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  handler: async ({ post_id, supported }, ctx) => {
    const userId = requireAuth(ctx);
    if (!userId) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);

    if (supported) {
      const { error } = await supabase
        .from("post_supports")
        .upsert({ post_id, user_id: userId }, { onConflict: "post_id,user_id" });
      if (error) return errorResult(error.message);
    } else {
      const { error } = await supabase
        .from("post_supports")
        .delete()
        .eq("post_id", post_id)
        .eq("user_id", userId);
      if (error) return errorResult(error.message);
    }

    const { data } = await supabase
      .from("posts")
      .select("id, support_count")
      .eq("id", post_id)
      .maybeSingle();

    return {
      ...textResult({ post_id, supported, support_count: data?.support_count ?? null }),
      structuredContent: { post_id, supported, support_count: data?.support_count ?? null },
    };
  },
});
