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
  name: "create_community_post",
  title: "Create a community post",
  description:
    "Publish a post to the Protidhwani community feed as the signed-in citizen. Bangla title/body are required; English versions are optional.",
  inputSchema: {
    kind: z.enum(POST_KINDS).describe("Post kind."),
    title: z.string().describe("Bangla title, 3-200 characters."),
    body: z.string().describe("Bangla body, 5-5000 characters."),
    title_en: z.string().optional().describe("Optional English title."),
    body_en: z.string().optional().describe("Optional English body."),
    location: z.string().optional().describe("Area / street / landmark."),
    district: z.string().optional().describe("District name."),
    tags: z.array(z.string()).optional().describe("Topic tags."),
    level: z
      .enum(["critical", "high", "moderate"])
      .optional()
      .describe("Urgency level for report/emergency posts."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const userId = requireAuth(ctx);
    if (!userId) return errorResult("Not authenticated");

    const title = input.title.trim();
    const body = input.body.trim();
    if (title.length < 3 || title.length > 200) {
      return errorResult("Title must be between 3 and 200 characters");
    }
    if (body.length < 5 || body.length > 5000) {
      return errorResult("Body must be between 5 and 5000 characters");
    }

    const { data, error } = await supabaseForUser(ctx)
      .from("posts")
      .insert({
        user_id: userId,
        kind: input.kind,
        title,
        body,
        title_en: input.title_en?.trim() || null,
        body_en: input.body_en?.trim() || null,
        location: input.location?.trim() || null,
        district: input.district?.trim() || null,
        tags: input.tags ?? [],
        image_urls: [],
        level: input.level ?? null,
      })
      .select("*")
      .single();

    if (error) return errorResult(error.message);
    return { ...textResult(data), structuredContent: { post: data } };
  },
});
