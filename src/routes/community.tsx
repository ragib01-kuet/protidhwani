import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PenLine, Plus, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { CommentsSheet } from "@/components/community/CommentsSheet";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { PostComposerModal } from "@/components/community/PostComposerModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase, getErrorMessage } from "@/integrations/supabase/client";
import type { CommunityPostKind } from "@/integrations/supabase/database.types";
import {
  DEMO_COMMENTS,
  DEMO_POSTS,
  filterDemoPosts,
  isDemoPost,
} from "@/data/community-demo";

import { DISTRICTS, POST_KINDS, TONE_CLASS } from "@/lib/community-meta";
import { cn } from "@/lib/utils";
import {
  addPostComment,
  createPost,
  deletePost,
  deletePostComment,
  flagPost,
  listMyFlaggedPostIds,
  listMySupportedPostIds,
  listPostComments,
  listPosts,
  toggleSupport,
  updatePost,
  uploadPostImages,
  type FeedSort,
  type PostInput,
  type PostWithAuthor,
} from "@/services/community";

export const Route = createFileRoute("/community")({
  validateSearch: (search: Record<string, unknown>) => ({
    post: typeof search.post === "string" ? search.post : undefined,
  }),
  head: () => ({
    meta: [
      { title: "কমিউনিটি · Community — Protidhwani" },
      {
        name: "description",
        content:
          "Live community feed of civic reports, emergencies, discussions and verified information from citizens across Bangladesh.",
      },
      { property: "og:title", content: "কমিউনিটি · Community — Protidhwani" },
      {
        property: "og:description",
        content: "Reports, discussions, polls and events from citizens across Bangladesh.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Community,
});

const SORTS: { value: FeedSort; bn: string; en: string }[] = [
  { value: "recent", bn: "সাম্প্রতিক", en: "Recent" },
  { value: "top", bn: "সর্বাধিক সমর্থিত", en: "Top" },
  { value: "discussed", bn: "আলোচিত", en: "Discussed" },
];

const FLAG_REASONS = [
  { value: "misinformation", bn: "ভুল তথ্য", en: "Misinformation" },
  { value: "spam", bn: "স্প্যাম", en: "Spam" },
  { value: "harassment", bn: "হয়রানি", en: "Harassment" },
  { value: "other", bn: "অন্যান্য", en: "Other" },
];

function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { post: sharedPostId } = Route.useSearch();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<CommunityPostKind | "all">("all");
  const [district, setDistrict] = useState<string>("");
  const [sort, setSort] = useState<FeedSort>("recent");
  const [mineOnly, setMineOnly] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<PostWithAuthor | null>(null);
  const [composerKind, setComposerKind] = useState<CommunityPostKind>("report");
  const [commentsFor, setCommentsFor] = useState<PostWithAuthor | null>(null);
  const [flagFor, setFlagFor] = useState<PostWithAuthor | null>(null);
  const [flagReason, setFlagReason] = useState("misinformation");
  const [deleteFor, setDeleteFor] = useState<PostWithAuthor | null>(null);
  const [busyPostId, setBusyPostId] = useState<string | null>(null);

  // Demo feed state (session-only): supports and comments on seeded posts.
  const [demoPosts, setDemoPosts] = useState<PostWithAuthor[]>(DEMO_POSTS);
  const [demoComments, setDemoComments] = useState(DEMO_COMMENTS);
  const [demoSupported, setDemoSupported] = useState<string[]>([]);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      kind,
      district: district || null,
      sort,
      search,
      mine: mineOnly && user ? user.id : null,
    }),
    [kind, district, sort, search, mineOnly, user],
  );

  const feedKey = ["community", "posts", filters] as const;

  const feed = useQuery({
    queryKey: feedKey,
    queryFn: () => listPosts(filters),
  });

  const supports = useQuery({
    queryKey: ["community", "supports", user?.id],
    queryFn: () => listMySupportedPostIds(user!.id),
    enabled: Boolean(user),
  });

  const flags = useQuery({
    queryKey: ["community", "flags", user?.id],
    queryFn: () => listMyFlaggedPostIds(user!.id),
    enabled: Boolean(user),
  });

  const comments = useQuery({
    queryKey: ["community", "comments", commentsFor?.id],
    queryFn: () => listPostComments(commentsFor!.id),
    enabled: Boolean(commentsFor) && !isDemoPost(commentsFor!.id),
  });



  const invalidateFeed = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
  }, [queryClient]);

  // Live feed: any insert/update/delete on posts refreshes the list.
  useEffect(() => {
    const channel = supabase
      .channel("community-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, invalidateFeed)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments" }, () => {
        invalidateFeed();
        queryClient.invalidateQueries({ queryKey: ["community", "comments"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [invalidateFeed, queryClient]);

  const requireAuth = useCallback(
    (message: string) => {
      if (user) return true;
      toast.error(message, {
        description: "Sign in to continue",
        action: {
          label: "সাইন ইন",
          onClick: () => navigate({ to: "/auth/login", search: { redirect: "/community" } }),
        },
      });
      return false;
    },
    [user, navigate],
  );

  const savePost = useMutation({
    mutationFn: async ({
      input,
      files,
    }: {
      input: PostInput;
      files: File[];
      removed: string[];
    }) => {
      const uploaded = files.length ? await uploadPostImages(user!.id, files) : [];
      const payload = { ...input, image_urls: [...input.image_urls, ...uploaded] };
      return editing ? updatePost(editing.id, payload) : createPost(user!.id, payload);
    },
    onSuccess: () => {
      toast.success(editing ? "পোস্ট হালনাগাদ হয়েছে" : "পোস্ট প্রকাশিত হয়েছে", {
        description: editing ? "Post updated" : "Your post is live",
      });
      setComposerOpen(false);
      setEditing(null);
      invalidateFeed();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const removePost = useMutation({
    mutationFn: (post: PostWithAuthor) => deletePost(post.id),
    onSuccess: () => {
      toast.success("পোস্ট মুছে ফেলা হয়েছে", { description: "Post deleted" });
      setDeleteFor(null);
      invalidateFeed();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const support = useMutation({
    mutationFn: (post: PostWithAuthor) => toggleSupport(post.id, user!.id),
    onMutate: (post) => setBusyPostId(post.id),
    onSuccess: (result) => {
      toast.success(result === "added" ? "সমর্থন যোগ হয়েছে" : "সমর্থন প্রত্যাহার হয়েছে", {
        description: result === "added" ? "Support added" : "Support removed",
      });
      queryClient.invalidateQueries({ queryKey: ["community", "supports", user?.id] });
      invalidateFeed();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setBusyPostId(null),
  });

  const addComment = useMutation({
    mutationFn: (body: string) => addPostComment(commentsFor!.id, user!.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "comments", commentsFor?.id] });
      invalidateFeed();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const removeComment = useMutation({
    mutationFn: (id: string) => deletePostComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "comments", commentsFor?.id] });
      invalidateFeed();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const submitFlag = useMutation({
    mutationFn: () => flagPost(flagFor!.id, user!.id, flagReason),
    onSuccess: () => {
      toast.success("রিপোর্ট পাঠানো হয়েছে", { description: "Thanks — moderators will review it" });
      setFlagFor(null);
      queryClient.invalidateQueries({ queryKey: ["community", "flags", user?.id] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleShare = async (post: PostWithAuthor) => {
    const url = `${window.location.origin}/community?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.title_en ?? post.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("লিংক কপি হয়েছে", { description: "Link copied to clipboard" });
    } catch {
      /* user cancelled the share sheet */
    }
  };

  const openComposer = (nextKind: CommunityPostKind) => {
    if (!requireAuth("পোস্ট করতে সাইন ইন করুন")) return;
    setEditing(null);
    setComposerKind(nextKind);
    setComposerOpen(true);
  };

  const livePosts = feed.data ?? [];
  // Fall back to the seeded demo feed whenever live data has nothing to show.
  const demoVisible = filterDemoPosts(demoPosts, filters);
  const showingDemo =
    !feed.isLoading &&
    (feed.isError || livePosts.length === 0) &&
    demoVisible.length > 0;

  const posts = showingDemo ? demoVisible : livePosts;

  const toggleDemoSupport = (post: PostWithAuthor) => {
    const on = demoSupported.includes(post.id);
    setDemoSupported((prev) => (on ? prev.filter((id) => id !== post.id) : [...prev, post.id]));
    setDemoPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, support_count: p.support_count + (on ? -1 : 1) } : p,
      ),
    );
    toast.success(on ? "সমর্থন প্রত্যাহার হয়েছে" : "সমর্থন যোগ হয়েছে", {
      description: on ? "Support removed (demo)" : "Support added (demo)",
    });
  };

  const addDemoComment = (post: PostWithAuthor, body: string) => {
    const comment = {
      id: `demo-c-${crypto.randomUUID()}`,
      post_id: post.id,
      user_id: user?.id ?? "demo-guest",
      body,
      created_at: new Date().toISOString(),
      author: {
        id: user?.id ?? "demo-guest",
        full_name: "You",
        full_name_bn: "আপনি",
        username: "you",
        avatar_url: null,
      },
    } as (typeof DEMO_COMMENTS)[string][number];
    setDemoComments((prev) => ({ ...prev, [post.id]: [...(prev[post.id] ?? []), comment] }));
    setDemoPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, comment_count: p.comment_count + 1 } : p)),
    );
    toast.success("মন্তব্য যোগ হয়েছে", { description: "Comment added (demo)" });
  };


  // Deep link from a shared URL: scroll to and highlight the post.
  useEffect(() => {
    if (!sharedPostId || !posts.some((p) => p.id === sharedPostId)) return;
    const el = document.getElementById(`post-${sharedPostId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary");
    const timer = setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 2600);
    return () => clearTimeout(timer);
  }, [sharedPostId, posts]);
  const supportedIds = new Set(supports.data ?? []);
  const flaggedIds = new Set(flags.data ?? []);
  const activeFilters = (kind !== "all" ? 1 : 0) + (district ? 1 : 0) + (mineOnly ? 1 : 0);

  return (
    <AppShell
      title={{ bn: "কমিউনিটি", en: "Community" }}
      subtitle={showingDemo ? `${posts.length} demo posts` : feed.data ? `${posts.length} posts` : undefined}
      onSearchClick={() => searchRef.current?.focus()}
      hideComposer
    >
      {/* Composer — hidden on mobile; mobile users use the floating action buttons */}
      <section className="hidden rounded-[2rem] border border-border bg-card p-5 shadow-card md:block">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h2 lang="bn" className="text-base font-bold">
              নাগরিক কম্পোজার
            </h2>
            <p lang="en" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Civic Composer
            </p>
          </div>
          <button
            onClick={() => openComposer("report")}
            className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-95"
          >
            <PenLine className="size-4" />
            <span lang="bn">নতুন পোস্ট</span>
          </button>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {POST_KINDS.map((o) => (
            <button
              key={o.kind}
              onClick={() => openComposer(o.kind)}
              className="flex flex-col items-center gap-1 rounded-3xl border border-border bg-surface px-1 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 active:scale-95"
            >
              <span className="text-xl">{o.icon}</span>
              <span lang="bn" className="text-[11px] font-bold leading-none">
                {o.bn}
              </span>
              <span lang="en" className="text-[8px] uppercase tracking-wider text-muted-foreground">
                {o.en}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section className="mt-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="খুঁজুন · Search reports, areas, tags"
            aria-label="খুঁজুন / Search the community feed"
            className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-11 text-sm outline-none transition-colors focus:border-primary/60"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              aria-label="মুছুন / Clear search"
              className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-surface"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          <FilterChip active={kind === "all"} onClick={() => setKind("all")} bn="সব" en="All" />
          {POST_KINDS.map((o) => (
            <FilterChip
              key={o.kind}
              active={kind === o.kind}
              onClick={() => setKind(o.kind)}
              bn={o.bn}
              en={o.en}
              activeClass={TONE_CLASS[o.tone]}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            aria-label="জেলা / District"
            className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold outline-none"
          >
            <option value="">সব জেলা · All districts</option>
            {DISTRICTS.map((d) => (
              <option key={d.en} value={d.en}>
                {d.bn} · {d.en}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as FeedSort)}
            aria-label="সাজান / Sort"
            className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.bn} · {s.en}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!requireAuth("নিজের পোস্ট দেখতে সাইন ইন করুন")) return;
              setMineOnly((v) => !v);
            }}
            aria-pressed={mineOnly}
            className={cn(
              "rounded-full border border-border px-4 py-2 text-xs font-semibold transition-colors",
              mineOnly ? "border-transparent bg-brand-soft text-primary" : "bg-card",
            )}
          >
            <span lang="bn">আমার পোস্ট</span>{" "}
            <span lang="en" className="text-[10px] text-muted-foreground">
              Mine
            </span>
          </button>
          <button
            onClick={() => feed.refetch()}
            aria-label="রিফ্রেশ / Refresh"
            className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
          >
            <RefreshCw className={cn("size-4", feed.isFetching && "animate-spin")} />
          </button>
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setKind("all");
                setDistrict("");
                setMineOnly(false);
              }}
              className="rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
            >
              <span lang="bn">ফিল্টার মুছুন</span> · <span lang="en">Clear</span>
            </button>
          )}
        </div>
      </section>

      {/* Demo banner */}
      {showingDemo && (
        <section className="mt-5 rounded-[1.75rem] border border-warning/30 bg-warning-soft p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p lang="bn" className="text-sm font-bold text-warning">
                ডেমো ফিড দেখানো হচ্ছে
              </p>
              <p lang="en" className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-warning/80">
                Demo mode · Seeded posts with photos
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-warning px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-warning-foreground">
              Demo
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <span lang="bn">লাইভ পোস্ট এলে ডেমো নিজে থেকেই সরে যাবে। সমর্থন ও মন্তব্য এই সেশনেই সংরক্ষিত থাকে।</span>{" "}
            <span lang="en">
              Demo posts disappear as soon as live posts exist. Supports and comments here are kept
              for this session only.
            </span>
          </p>
        </section>
      )}

      {/* Feed */}
      <div className="mt-5 space-y-4">
        {feed.isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-[1.75rem] border border-border bg-card" />
            ))}
          </div>
        ) : feed.isError && !showingDemo ? (

          <div role="alert" className="rounded-[1.75rem] border border-emergency/30 bg-emergency-soft p-6">
            <p lang="bn" className="text-sm font-bold text-emergency">
              ফিড লোড করা যায়নি
            </p>
            <p lang="en" className="mt-1 text-xs text-emergency/80">
              {getErrorMessage(feed.error)}
            </p>
            <button
              onClick={() => feed.refetch()}
              className="mt-4 rounded-full bg-emergency px-4 py-2 text-xs font-bold text-emergency-foreground"
            >
              আবার চেষ্টা করুন · Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-border bg-card p-10 text-center">
            <p lang="bn" className="text-base font-bold">
              এখনও কোনো পোস্ট নেই
            </p>
            <p lang="en" className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              No posts match this view
            </p>
            <button
              onClick={() => openComposer("report")}
              className="mx-auto mt-5 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              <Plus className="size-4" />
              <span lang="bn">প্রথম পোস্টটি করুন</span>
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              supported={
                isDemoPost(post.id) ? demoSupported.includes(post.id) : supportedIds.has(post.id)
              }
              flagged={flaggedIds.has(post.id)}
              isOwner={!isDemoPost(post.id) && user?.id === post.user_id}
              busy={busyPostId === post.id}
              onSupport={(p) => {
                if (isDemoPost(p.id)) {
                  toggleDemoSupport(p);
                  return;
                }
                if (!requireAuth("সমর্থন করতে সাইন ইন করুন")) return;
                support.mutate(p);
              }}
              onComment={setCommentsFor}
              onShare={handleShare}
              onFlag={(p) => {
                if (isDemoPost(p.id)) {
                  toast.success("রিপোর্ট পাঠানো হয়েছে", {
                    description: "Flag recorded in demo mode",
                  });
                  return;
                }
                if (!requireAuth("রিপোর্ট করতে সাইন ইন করুন")) return;
                setFlagReason("misinformation");
                setFlagFor(p);
              }}

              onEdit={(p) => {
                setEditing(p);
                setComposerOpen(true);
              }}
              onDelete={setDeleteFor}
            />
          ))
        )}
        {feed.isFetching && !feed.isLoading && (
          <p className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> হালনাগাদ হচ্ছে · Updating
          </p>
        )}
      </div>

      {/* Floating composer button */}
      <button
        onClick={() => openComposer("report")}
        aria-label="নতুন পোস্ট / New post"
        className="fixed bottom-40 right-4 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform hover:scale-105 active:scale-95 lg:bottom-24"
      >
        <PenLine className="size-5" />
      </button>

      <PostComposerModal
        open={composerOpen}
        onOpenChange={(open) => {
          setComposerOpen(open);
          if (!open) setEditing(null);
        }}
        editing={editing}
        initialKind={composerKind}
        submitting={savePost.isPending}
        onSubmit={async (input, files, removed) => {
          await savePost.mutateAsync({ input, files, removed });
        }}
      />

      <CommentsSheet
        post={commentsFor}
        open={Boolean(commentsFor)}
        onOpenChange={(open) => !open && setCommentsFor(null)}
        comments={
          commentsFor && isDemoPost(commentsFor.id)
            ? (demoComments[commentsFor.id] ?? [])
            : (comments.data ?? [])
        }
        loading={comments.isLoading}
        posting={addComment.isPending}
        currentUserId={
          user?.id ?? (commentsFor && isDemoPost(commentsFor.id) ? "demo-guest" : null)
        }
        onSubmit={async (body) => {
          if (commentsFor && isDemoPost(commentsFor.id)) {
            addDemoComment(commentsFor, body);
            return;
          }
          await addComment.mutateAsync(body);
        }}
        onDelete={(c) => {
          if (isDemoPost(c.post_id)) {
            setDemoComments((prev) => ({
              ...prev,
              [c.post_id]: (prev[c.post_id] ?? []).filter((x) => x.id !== c.id),
            }));
            setDemoPosts((prev) =>
              prev.map((p) =>
                p.id === c.post_id
                  ? { ...p, comment_count: Math.max(0, p.comment_count - 1) }
                  : p,
              ),
            );
            return;
          }
          removeComment.mutate(c.id);
        }}

        onSignIn={() => navigate({ to: "/auth/login", search: { redirect: "/community" } })}
      />

      {/* Flag dialog */}
      <Dialog open={Boolean(flagFor)} onOpenChange={(open) => !open && setFlagFor(null)}>
        <DialogContent className="rounded-[1.75rem] sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle asChild>
              <span className="block">
                <span lang="bn" className="block text-base font-bold">
                  ভুল তথ্য রিপোর্ট করুন
                </span>
                <span lang="en" className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Report this post
                </span>
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {FLAG_REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setFlagReason(r.value)}
                aria-pressed={flagReason === r.value}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 text-left transition-colors",
                  flagReason === r.value ? "border-transparent bg-brand-soft text-primary" : "bg-surface",
                )}
              >
                <span lang="bn" className="text-sm font-bold">
                  {r.bn}
                </span>
                <span lang="en" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {r.en}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => submitFlag.mutate()}
            disabled={submitFlag.isPending}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-emergency px-4 py-3 text-sm font-bold text-emergency-foreground disabled:opacity-60"
          >
            {submitFlag.isPending && <Loader2 className="size-4 animate-spin" />}
            <span lang="bn">রিপোর্ট পাঠান</span>
            <span lang="en" className="text-[10px] uppercase tracking-wider opacity-80">
              Submit report
            </span>
          </button>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(deleteFor)} onOpenChange={(open) => !open && setDeleteFor(null)}>
        <AlertDialogContent className="rounded-[1.75rem]">
          <AlertDialogHeader>
            <AlertDialogTitle lang="bn">পোস্টটি মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription lang="en">
              This permanently deletes the post along with its supports and comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল · Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFor && removePost.mutate(deleteFor)}
              className="bg-emergency text-emergency-foreground hover:bg-emergency/90"
            >
              মুছে ফেলুন · Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function FilterChip({
  active,
  onClick,
  bn,
  en,
  activeClass = "bg-brand-soft text-primary",
}: {
  active: boolean;
  onClick: () => void;
  bn: string;
  en: string;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border border-border bg-card px-4 py-2 transition-all hover:-translate-y-0.5 active:scale-95",
        active && cn("border-transparent", activeClass),
      )}
    >
      <span lang="bn" className="block text-xs font-bold leading-none">
        {bn}
      </span>
      <span lang="en" className="block text-[8px] uppercase tracking-wider opacity-70">
        {en}
      </span>
    </button>
  );
}
