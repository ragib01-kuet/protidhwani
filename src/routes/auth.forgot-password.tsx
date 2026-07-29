import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { AuthCard, FormAlert } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage, supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "পাসওয়ার্ড রিসেট Reset password — Protidhwani" },
      {
        name: "description",
        content: "Request a password reset link for your Protidhwani civic account.",
      },
      { property: "og:title", content: "পাসওয়ার্ড রিসেট Reset password — Protidhwani" },
      { property: "og:description", content: "Recover access to your Protidhwani account." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (resetError) {
      setError(getErrorMessage(resetError));
      return;
    }
    setSent(true);
  }

  return (
    <AuthCard
      bn="পাসওয়ার্ড ভুলে গেছেন?"
      en="Forgot your password?"
      subtitle="রিসেট লিংক ইমেইলে পাঠানো হবে"
    >
      {error ? <FormAlert tone="error" message={error} /> : null}
      {sent ? (
        <FormAlert
          tone="success"
          message="লিংক পাঠানো হয়েছে — If that email exists, a reset link is on its way."
        />
      ) : null}

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
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          <span lang="bn">রিসেট লিংক পাঠান</span>{" "}
          <span className="opacity-70">Send reset link</span>
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/auth/login" className="font-semibold text-primary hover:underline">
          লগইনে ফিরে যান Back to login
        </Link>
      </p>
    </AuthCard>
  );
}
