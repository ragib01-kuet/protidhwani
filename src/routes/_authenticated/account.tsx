import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage, supabase } from "@/integrations/supabase/client";
import { getProfile, uploadAvatar, upsertProfile } from "@/services/profiles";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "আমার প্রোফাইল My profile — Protidhwani" },
      { name: "description", content: "Manage your Protidhwani profile, avatar and district." },
      { property: "og:title", content: "আমার প্রোফাইল My profile — Protidhwani" },
      { property: "og:description", content: "Update your civic identity on Protidhwani." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId),
    enabled: Boolean(userId),
  });

  const [form, setForm] = useState({
    full_name_bn: "",
    full_name: "",
    username: "",
    phone: "",
    district: "",
    bio: "",
    avatar_url: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const p = profileQuery.data;
    if (!p) return;
    setForm({
      full_name_bn: p.full_name_bn ?? "",
      full_name: p.full_name ?? "",
      username: p.username ?? "",
      phone: p.phone ?? "",
      district: p.district ?? "",
      bio: p.bio ?? "",
      avatar_url: p.avatar_url ?? "",
    });
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertProfile(userId, {
        full_name_bn: form.full_name_bn || null,
        full_name: form.full_name || null,
        username: form.username || null,
        phone: form.phone || null,
        district: form.district || null,
        bio: form.bio || null,
        avatar_url: form.avatar_url || null,
      }),
    onSuccess: () => {
      toast.success("প্রোফাইল সংরক্ষিত — Profile saved");
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  async function handleAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(userId, file);
      setForm((prev) => ({ ...prev, avatar_url: url }));
      toast.success("ছবি আপলোড হয়েছে — Image uploaded");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth/login", replace: true });
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-8 pb-28">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 lang="bn" className="text-2xl font-bold text-foreground">
            আমার প্রোফাইল
          </h1>
          <p lang="en" className="text-sm text-muted-foreground">
            My profile · {user?.email}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="size-4" />
          <span lang="bn">লগআউট</span>
        </Button>
      </header>

      {profileQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> লোড হচ্ছে — Loading profile…
        </div>
      ) : profileQuery.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {getErrorMessage(profileQuery.error)}
        </div>
      ) : (
        <form
          className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="flex items-center gap-4">
            <div className="size-16 overflow-hidden rounded-2xl bg-secondary">
              {form.avatar_url ? (
                <img
                  src={form.avatar_url}
                  alt="Profile avatar"
                  className="size-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-secondary">
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              <span lang="bn">ছবি আপলোড</span> <span className="opacity-70">Upload</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatar}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="full_name_bn">
                <span lang="bn">নাম (বাংলা)</span>{" "}
                <span className="text-muted-foreground">Name (Bangla)</span>
              </Label>
              <Input
                id="full_name_bn"
                lang="bn"
                value={form.full_name_bn}
                onChange={(e) => setForm({ ...form, full_name_bn: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="full_name">
                <span lang="bn">নাম (ইংরেজি)</span>{" "}
                <span className="text-muted-foreground">Name (English)</span>
              </Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="username">
                <span lang="bn">ইউজারনেম</span>{" "}
                <span className="text-muted-foreground">Username</span>
              </Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="phone">
                <span lang="bn">মোবাইল</span> <span className="text-muted-foreground">Phone</span>
              </Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="district">
                <span lang="bn">জেলা</span> <span className="text-muted-foreground">District</span>
              </Label>
              <Input
                id="district"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="bio">
                <span lang="bn">পরিচিতি</span> <span className="text-muted-foreground">Bio</span>
              </Label>
              <Textarea
                id="bio"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              <span lang="bn">সংরক্ষণ</span> <span className="opacity-70">Save</span>
            </Button>
            <Link
              to="/complaints"
              className="text-sm font-semibold text-primary hover:underline"
            >
              আমার অভিযোগ My complaints →
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}
