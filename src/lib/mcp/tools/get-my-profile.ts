import { defineTool } from "@lovable.dev/mcp-js";

import { errorResult, requireAuth, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "get_my_profile",
  title: "Get my citizen profile",
  description:
    "Read the signed-in citizen's Protidhwani profile plus counts of their posts, comments and complaints.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const userId = requireAuth(ctx);
    if (!userId) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);

    const [profile, posts, comments, complaints] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase
        .from("post_comments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("complaints")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    if (profile.error) return errorResult(profile.error.message);

    const result = {
      email: ctx.getUserEmail() ?? null,
      profile: profile.data ?? null,
      stats: {
        posts: posts.count ?? 0,
        comments: comments.count ?? 0,
        complaints: complaints.count ?? 0,
      },
    };
    return { ...textResult(result), structuredContent: result };
  },
});
