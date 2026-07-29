import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthCard, FormAlert } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage, supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "নতুন পাসওয়ার্ড New password — Protidhwani" },
      { name: "description", content: "Set a new password for your Protidhwani account." },
      { property: "og:title", content: "নতুন পাসওয়ার্ড New password — Protidhwani" },
      { property: "og:description", content: "Choose a new password to secure your account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase turns the recovery link hash into a temporary session.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else if (!window.location.hash.includes("type=recovery")) {
        setError("রিকভারি লিংক অবৈধ — This reset link is invalid or has expired.");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("পাসওয়ার্ড মিলছে না — Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(getErrorMessage(updateError));
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/account", replace: true }), 1200);
  }

  return (
    <AuthCard bn="নতুন পাসওয়ার্ড দিন" en="Set a new password" subtitle="কমপক্ষে ৮ অক্ষর ব্যবহার করুন">
      {error ? <FormAlert tone="error" message={error} /> : null}
      {done ? (
        <FormAlert tone="success" message="পাসওয়ার্ড হালনাগাদ হয়েছে — Password updated." />
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">
            <span lang="bn">নতুন পাসওয়ার্ড</span>{" "}
            <span className="text-muted-foreground">New password</span>
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="confirm">
            <span lang="bn">নিশ্চিত করুন</span> <span className="text-muted-foreground">Confirm</span>
          </Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <Button type="submit" disabled={submitting || !ready} className="w-full">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          <span lang="bn">সংরক্ষণ করুন</span> <span className="opacity-70">Save password</span>
        </Button>
      </form>
    </AuthCard>
  );
}
