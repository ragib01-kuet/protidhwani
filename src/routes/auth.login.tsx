import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { AuthCard, FormAlert } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage, supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/login")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "লগইন Login — Protidhwani" },
      {
        name: "description",
        content: "Sign in to Protidhwani to report civic issues, vote and organise your community.",
      },
      { property: "og:title", content: "লগইন Login — Protidhwani" },
      {
        property: "og:description",
        content: "Sign in to Protidhwani, the citizen-powered civic network for Bangladesh.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/login" });
  const { session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination = search.redirect?.startsWith("/") ? search.redirect : "/account";

  useEffect(() => {
    if (!authLoading && session) navigate({ to: destination, replace: true });
  }, [authLoading, session, destination, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (signInError) {
      setError(getErrorMessage(signInError));
      return;
    }
    navigate({ to: destination, replace: true });
  }

  return (
    <AuthCard bn="আবার স্বাগতম" en="Welcome back" subtitle="ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন">
      {error ? <FormAlert tone="error" message={error} /> : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">
            <span lang="bn">ইমেইল</span> <span className="text-muted-foreground">Email</span>
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">
              <span lang="bn">পাসওয়ার্ড</span>{" "}
              <span className="text-muted-foreground">Password</span>
            </Label>
            <Link
              to="/auth/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              ভুলে গেছেন? Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          <span lang="bn">লগইন</span> <span className="opacity-70">Login</span>
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <span lang="bn">অ্যাকাউন্ট নেই?</span> No account?{" "}
        <Link to="/auth/signup" className="font-semibold text-primary hover:underline">
          সাইন আপ Sign up
        </Link>
      </p>
    </AuthCard>
  );
}
