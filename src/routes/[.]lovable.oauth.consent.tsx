import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type OAuthResult = {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string; client_uri?: string } | null;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthResult | null; error: Error | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthResult | null; error: Error | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthResult | null; error: Error | null }>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // Browser-only: the Supabase session lives in localStorage, absent during SSR.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth/login", search: { redirect: next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: ConsentPage,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-semibold text-foreground">
          <span lang="bn">অনুরোধটি লোড করা যায়নি</span>{" "}
          <span className="text-muted-foreground">Could not load this request</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "একটি অ্যাপ · an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error: decisionError } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (decisionError) {
      setBusy(false);
      setError(decisionError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          <span lang="bn">সংযোগের অনুমতি</span>{" "}
          <span className="text-muted-foreground">Connection request</span>
        </p>
        <h1 className="mt-3 text-xl font-semibold leading-snug text-foreground">
          <span lang="bn">{clientName} আপনার প্রতিধ্বনি অ্যাকাউন্টে যুক্ত হতে চায়</span>
          <span className="mt-1 block text-base font-medium text-muted-foreground">
            {clientName} wants to connect to your Protidhwani account
          </span>
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          <span lang="bn">
            অনুমতি দিলে এই অ্যাপটি আপনার হয়ে পোস্ট, মন্তব্য, সমর্থন ও অভিযোগ পড়তে ও তৈরি করতে
            পারবে।
          </span>{" "}
          It will read and create posts, comments, supports and complaints as you.
        </p>
        {error ? (
          <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex gap-3">
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            <span lang="bn">অনুমতি দিন</span> <span className="opacity-70">Approve</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={busy}
            onClick={() => decide(false)}
          >
            <span lang="bn">বাতিল</span> <span className="opacity-70">Deny</span>
          </Button>
        </div>
      </div>
    </main>
  );
}
