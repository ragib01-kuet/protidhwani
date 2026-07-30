import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { AuthCard, FormAlert } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage, supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "সাইন আপ Sign up — Protidhwani" },
      {
        name: "description",
        content: "Create a Protidhwani account to report incidents and organise with your community.",
      },
      { property: "og:title", content: "সাইন আপ Sign up — Protidhwani" },
      {
        property: "og:description",
        content: "Join the citizen-powered civic network for Bangladesh.",
      },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (password !== confirm) {
      setError("পাসওয়ার্ড মিলছে না — Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setSubmitting(false);
      setError(getErrorMessage(signUpError));
      return;
    }
    if (data.session) {
      setSubmitting(false);
      navigate({ to: "/account", replace: true });
      return;
    }

    // Demo app: no email verification step — sign the user straight in.
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);

    if (signInData?.session) {
      navigate({ to: "/account", replace: true });
      return;
    }
    setError(
      getErrorMessage(signInError) ??
        "সাইন আপ সম্পূর্ণ হয়নি — Sign up could not be completed. Please try again.",
    );

  }

  return (
    <AuthCard bn="অ্যাকাউন্ট খুলুন" en="Create your account" subtitle="নাগরিক নেটওয়ার্কে যোগ দিন">
      {error ? <FormAlert tone="error" message={error} /> : null}
      {notice ? <FormAlert tone="success" message={notice} /> : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName">
            <span lang="bn">পুরো নাম</span> <span className="text-muted-foreground">Full name</span>
          </Label>
          <Input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1.5"
          />
        </div>
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
          <Label htmlFor="password">
            <span lang="bn">পাসওয়ার্ড</span> <span className="text-muted-foreground">Password</span>
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
          <p className="mt-1 text-xs text-muted-foreground">কমপক্ষে ৮ অক্ষর — minimum 8 characters</p>
        </div>
        <div>
          <Label htmlFor="confirm">
            <span lang="bn">পাসওয়ার্ড নিশ্চিত করুন</span>{" "}
            <span className="text-muted-foreground">Confirm</span>
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
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          <span lang="bn">সাইন আপ</span> <span className="opacity-70">Sign up</span>
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <span lang="bn">অ্যাকাউন্ট আছে?</span> Already registered?{" "}
        <Link to="/auth/login" className="font-semibold text-primary hover:underline">
          লগইন Login
        </Link>
      </p>
    </AuthCard>
  );
}
