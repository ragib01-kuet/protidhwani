import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { errorResult, requireAuth, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_complaints",
  title: "List civic complaints",
  description:
    "List civic complaints filed on Protidhwani, optionally only the signed-in citizen's own complaints or a given status.",
  inputSchema: {
    mine: z.boolean().optional().describe("Only complaints filed by the signed-in user."),
    status: z
      .enum(["open", "in_progress", "resolved", "rejected"])
      .optional()
      .describe("Filter by complaint status."),
    district: z.string().optional().describe("Filter by district."),
    limit: z.number().int().optional().describe("Max complaints to return (1-50, default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    const userId = requireAuth(ctx);
    if (!userId) return errorResult("Not authenticated");

    const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
    let query = supabaseForUser(ctx)
      .from("complaints")
      .select("id, title, description, location, district, status, vote_count, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (input.mine) query = query.eq("user_id", userId);
    if (input.status) query = query.eq("status", input.status);
    if (input.district) query = query.eq("district", input.district);

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return { ...textResult(data ?? []), structuredContent: { complaints: data ?? [] } };
  },
});
