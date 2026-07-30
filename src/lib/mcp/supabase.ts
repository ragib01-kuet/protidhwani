import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/**
 * Supabase connection details. VITE_* values are inlined by Vite at build time;
 * process.env is the fallback for the server runtime. Never read at module scope
 * in a way that throws — the MCP entry is evaluated during build/cold start.
 */
function config() {
  const env = import.meta.env as Record<string, string | undefined>;
  const url = env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    env.VITE_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;
  return { url, key };
}

/** Project ref used to build the OAuth issuer (direct supabase.co host). */
export function supabaseProjectRef(): string {
  const { url } = config();
  const match = url?.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match?.[1] ?? "project-ref-unset";
}

/**
 * Supabase client that acts as the MCP caller: the verified bearer token is
 * forwarded, so Row Level Security runs as that user.
 */
export function supabaseForUser(ctx: ToolContext): SupabaseClient {
  const { url, key } = config();
  if (!url || !key) throw new Error("Supabase is not configured on the server");
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

export function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function requireAuth(ctx: ToolContext): string | null {
  return ctx.isAuthenticated() ? (ctx.getUserId() ?? null) : null;
}
