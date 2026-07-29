import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  ChevronRight,
  Loader2,
  LogIn,
  LogOut,
  Pencil,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage, supabase } from "@/integrations/supabase/client";
import { listPosts } from "@/services/community";
import { getProfile, getProfileStats, uploadAvatar, upsertProfile } from "@/services/profiles";
import { toBnNumber } from "@/utils/bn";

export const Route = createFileRoute("/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "প্রোফাইল · Profile — Protidhwani" },
      {
        name: "description",
        content:
          "Your civic profile: contributions, verification level and tracked reports on Protidhwani.",
      },
      { property: "og:title", content: "প্রোফাইল · Profile — Protidhwani" },
      {
        property: "og:description",
        content: "Civic contributions, verification level and tracked reports.",
      },
    ],
  }),
  component: Profile,
});

function initials(name: string) {
  return name.trim().slice(0, 2) || "প্র";
}

function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId),
    enabled: Boolean(userId),
  });
  const statsQuery = useQuery({
    queryKey: ["profile-stats", userId],
    queryFn: () => getProfileStats(userId),
    enabled: Boolean(userId),
  });
  const myPostsQuery = useQuery({
    queryKey: ["my-posts", userId],
    queryFn: () => listPosts({ mine: userId, sort: "recent" }),
    enabled: Boolean(userId),
  });

  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name_bn: "",
    full_name: "",
    username: "",
    phone: "",
    district: "",
    bio: "",
    avatar_url: "",
  });

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
        full_name_bn: form.full_name_bn.trim() || null,
        full_name: form.full_name.trim() || null,
        username: form.username.trim() || null,
        phone: form.phone.trim() || null,
        district: form.district.trim() || null,
        bio: form.bio.trim() || null,
        avatar_url: form.avatar_url || null,
      }),
    onSuccess: () => {
      toast.success("প্রোফাইল সংরক্ষিত · Profile saved");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  async function handleAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ছবি ৫ এমবি-র কম হতে হবে · Image must be under 5 MB");
      event.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const url = await uploadAvatar(userId, file);
      setForm((prev) => ({ ...prev, avatar_url: url }));
      await upsertProfile(userId, { avatar_url: url });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success("ছবি আপলোড হয়েছে · Image uploaded");
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(
        /bucket not found/i.test(message)
          ? "ছবি স্টোরেজ প্রস্তুত নয় · Image storage is not set up yet (avatars bucket missing)"
          : message,
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("লগআউট হয়েছে · Signed out");
    navigate({ to: "/auth/login", replace: true });
  }

  if (authLoading) {
    return (
      <AppShell title={{ bn: "প্রোফাইল", en: "Profile" }} showSearch={false} hideComposer>
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> লোড হচ্ছে · Loading…
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell title={{ bn: "প্রোফাইল", en: "Profile" }} showSearch={false} hideComposer>
        <section className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-card">
          <span className="mx-auto grid size-14 place-items-center rounded-3xl bg-brand-soft text-primary">
            <LogIn className="size-6" />
          </span>
          <h2 lang="bn" className="mt-4 text-lg font-bold">
            প্রোফাইল দেখতে লগইন করুন
          </h2>
          <p lang="en" className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Sign in to view your civic profile
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/auth/login" search={{ redirect: "/profile" }}>
                <span lang="bn">লগইন</span> <span className="opacity-70">Login</span>
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/auth/signup">
                <span lang="bn">নিবন্ধন</span> <span className="opacity-70">Sign up</span>
              </Link>
            </Button>
          </div>
        </section>
      </AppShell>
    );
  }

  const profile = profileQuery.data;
  const nameBn = profile?.full_name_bn?.trim() || profile?.username?.trim() || "নাগরিক";
  const nameEn = profile?.full_name?.trim() || user.email || "Citizen";
  const stats = statsQuery.data;
  const verified = (stats?.posts ?? 0) + (stats?.complaints ?? 0) >= 3;

  return (
    <AppShell
      title={{ bn: "প্রোফাইল", en: "Profile" }}
      subtitle={profile?.district ?? undefined}
      showSearch={false}
      hideComposer
    >
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
        <div className="flex items-start gap-4">
          <label className="relative grid size-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-3xl bg-brand-soft text-xl font-bold text-primary">
            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt={`${nameEn} avatar`}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <span lang="bn">{initials(nameBn)}</span>
            )}
            <span className="absolute inset-x-0 bottom-0 grid h-5 place-items-center bg-foreground/60 text-background">
              {uploading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Upload className="size-3" />
              )}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatar}
              disabled={uploading}
              aria-label="ছবি আপলোড · Upload avatar"
            />
          </label>

          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span lang="bn" className="truncate text-lg font-bold">
                {nameBn}
              </span>
              {verified && <BadgeCheck className="size-5 shrink-0 text-verified" />}
            </span>
            <span
              lang="en"
              className="block truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              {nameEn}
              {profile?.district ? ` · ${profile.district}` : ""}
            </span>
            {profile?.bio ? (
              <p lang="bn" className="mt-2 text-sm text-muted-foreground">
                {profile.bio}
              </p>
            ) : null}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing((v) => !v)}
            className="shrink-0"
          >
            <Pencil className="size-4" />
            <span lang="bn">সম্পাদনা</span>
          </Button>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-verified-soft px-4 py-3">
          <ShieldCheck className="size-4 shrink-0 text-verified" />
          <span>
            <span lang="bn" className="block text-xs font-bold text-verified">
              {verified ? "যাচাইকৃত নাগরিক" : "নতুন নাগরিক"} · স্তর{" "}
              {toBnNumber(verified ? 2 : 1)}
            </span>
            <span
              lang="en"
              className="block text-[10px] uppercase tracking-wider text-verified/70"
            >
              {verified ? "Verified citizen" : "New citizen"} · Level {verified ? 2 : 1}
            </span>
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { bn: "পোস্ট", en: "Posts", v: stats?.posts },
            { bn: "রিপোর্ট", en: "Reports", v: stats?.complaints },
            { bn: "সমর্থন", en: "Support given", v: stats?.supports },
            { bn: "মন্তব্য", en: "Comments", v: stats?.comments },
          ].map((s) => (
            <div key={s.en} className="rounded-2xl bg-surface px-3 py-3 text-center">
              <span lang="bn" className="block text-lg font-bold text-primary">
                {statsQuery.isLoading ? "…" : toBnNumber(s.v ?? 0)}
              </span>
              <span lang="bn" className="block text-[11px] font-semibold">
                {s.bn}
              </span>
              <span
                lang="en"
                className="block text-[9px] uppercase tracking-wider text-muted-foreground"
              >
                {s.en}
              </span>
            </div>
          ))}
        </div>
      </section>

      {editing && (
        <form
          className="mt-5 space-y-4 rounded-[2rem] border border-border bg-card p-6 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="p_name_bn">
                <span lang="bn">নাম (বাংলা)</span>{" "}
                <span className="text-muted-foreground">Name (Bangla)</span>
              </Label>
              <Input
                id="p_name_bn"
                lang="bn"
                value={form.full_name_bn}
                onChange={(e) => setForm({ ...form, full_name_bn: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="p_name">
                <span lang="bn">নাম (ইংরেজি)</span>{" "}
                <span className="text-muted-foreground">Name (English)</span>
              </Label>
              <Input
                id="p_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="p_username">
                <span lang="bn">ইউজারনেম</span>{" "}
                <span className="text-muted-foreground">Username</span>
              </Label>
              <Input
                id="p_username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="p_district">
                <span lang="bn">জেলা</span> <span className="text-muted-foreground">District</span>
              </Label>
              <Input
                id="p_district"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p_bio">
                <span lang="bn">পরিচিতি</span> <span className="text-muted-foreground">Bio</span>
              </Label>
              <Textarea
                id="p_bio"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              <span lang="bn">সংরক্ষণ</span> <span className="opacity-70">Save</span>
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              <span lang="bn">বাতিল</span> <span className="opacity-70">Cancel</span>
            </Button>
          </div>
        </form>
      )}

      <section className="mt-5 rounded-[2rem] border border-border bg-card p-6 shadow-card">
        <h2 className="flex items-baseline gap-2">
          <span lang="bn" className="text-base font-bold">
            আমার পোস্ট
          </span>
          <span
            lang="en"
            className="text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            My posts
          </span>
        </h2>
        {myPostsQuery.isLoading ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> লোড হচ্ছে · Loading…
          </p>
        ) : (myPostsQuery.data?.length ?? 0) === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            <span lang="bn">এখনও কোনো পোস্ট নেই।</span>{" "}
            <Link to="/community" className="font-semibold text-primary hover:underline">
              প্রথম পোস্ট করুন · Create your first post
            </Link>
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {myPostsQuery.data!.slice(0, 6).map((post) => (
              <li key={post.id}>
                <Link
                  to="/community"
                  search={{ post: post.id }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-surface px-4 py-3 transition-colors hover:bg-secondary"
                >
                  <span className="min-w-0">
                    <span lang="bn" className="block truncate text-sm font-semibold">
                      {post.title}
                    </span>
                    <span
                      lang="en"
                      className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground"
                    >
                      {toBnNumber(post.support_count)} support ·{" "}
                      {toBnNumber(post.comment_count)} comments
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-5 overflow-hidden rounded-[2rem] border border-border bg-card shadow-card">
        {(
          [
            { bn: "আমার অভিযোগ", en: "My reports", to: "/complaints" },
            { bn: "অ্যাকাউন্ট সেটিংস", en: "Account settings", to: "/account" },
            { bn: "জরুরি যোগাযোগ", en: "Emergency contacts", to: "/emergency" },
            { bn: "অধিকার সহায়িকা", en: "Rights guide", to: "/rights" },
            { bn: "নিরাপত্তা মানচিত্র", en: "Safety map", to: "/map" },
          ] as const
        ).map((r) => (
          <Link
            key={r.en}
            to={r.to}
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4 text-left transition-colors last:border-0 hover:bg-secondary"
          >
            <span className="min-w-0">
              <span lang="bn" className="block truncate text-sm font-semibold">
                {r.bn}
              </span>
              <span
                lang="en"
                className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                {r.en}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </section>

      <Button variant="outline" className="mt-5 w-full" onClick={handleSignOut}>
        <LogOut className="size-4" />
        <span lang="bn">লগআউট</span> <span className="opacity-70">Sign out</span>
      </Button>
    </AppShell>
  );
}
