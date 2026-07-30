import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { errorResult, requireAuth, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "create_complaint",
  title: "File a civic complaint",
  description:
    "File a civic complaint on Protidhwani as the signed-in citizen (roads, water, electricity, waste and similar issues).",
  inputSchema: {
    title: z.string().describe("Short complaint title."),
    description: z.string().describe("Full description of the civic issue."),
    location: z.string().optional().describe("Area / street / landmark."),
    district: z.string().optional().describe("District name."),
    category_id: z.string().optional().describe("Optional category UUID."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const userId = requireAuth(ctx);
    if (!userId) return errorResult("Not authenticated");

    const title = input.title.trim();
    const description = input.description.trim();
    if (title.length < 3) return errorResult("Title must be at least 3 characters");
    if (description.length < 5) return errorResult("Description must be at least 5 characters");

    const { data, error } = await supabaseForUser(ctx)
      .from("complaints")
      .insert({
        user_id: userId,
        title,
        description,
        location: input.location?.trim() || null,
        district: input.district?.trim() || null,
        category_id: input.category_id || null,
        image_url: null,
      })
      .select("*")
      .single();

    if (error) return errorResult(error.message);
    return { ...textResult(data), structuredContent: { complaint: data } };
  },
});
