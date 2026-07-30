import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BadgeCheck, Clock, Heart, MapPin, MessageCircle, Send, Share2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { feedPosts, kindMeta, postComments, type Post, type PostComment } from "@/lib/civic";
import { cn } from "@/lib/utils";

const toneClass = {
  brand: "bg-brand-soft text-primary",
  emergency: "bg-emergency-soft text-emergency",
  verified: "bg-verified-soft text-verified",
  warning: "bg-warning-soft text-warning",
};

const statusLabel = {
  verified: { bn: "যাচাইকৃত", en: "Verified", cls: "bg-verified-soft text-verified" },
  pending: { bn: "যাচাই চলছে", en: "Under review", cls: "bg-warning-soft text-warning" },
  disputed: { bn: "বিতর্কিত", en: "Disputed", cls: "bg-emergency-soft text-emergency" },
};

export const Route = createFileRoute("/explore/$postId")({
  loader: ({ params }): { post: Post } => {
    const post = feedPosts.find((p) => p.id === params.postId);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "পাওয়া যায়নি · Not found — Protidhwani" }, { name: "robots", content: "noindex" }],
      };
    }
    const { post } = loaderData;
    const title = `${post.title.bn} · ${post.title.en} — Protidhwani`;
    return {
      meta: [
        { title },
        { name: "description", content: post.body.en },
        { property: "og:title", content: title },
        { property: "og:description", content: post.body.en },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: PostNotFound,
  component: PostDetail,
});

function PostNotFound() {
  return (
    <AppShell title={{ bn: "পাওয়া যায়নি", en: "Not found" }} showBack hideComposer>
      <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-12 text-center">
        <p lang="bn" className="text-base font-bold">এই পোস্টটি আর নেই</p>
        <p lang="en" className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          This post is unavailable
        </p>
        <Link
          to="/explore"
          className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <span lang="bn">অন্বেষণে ফিরুন</span> <span lang="en" className="opacity-80">· Back to Explore</span>
        </Link>
      </div>
    </AppShell>
  );
}

function PostDetail() {
  const { post } = Route.useLoaderData() as { post: Post };
  const meta = kindMeta[post.kind];
  const status = statusLabel[post.status];
  const images = post.images ?? [];

  const seeded = useMemo<PostComment[]>(
    () => postComments[post.id] ?? postComments[post.id.split("-")[0]] ?? [],
    [post.id],
  );
  const [added, setAdded] = useState<PostComment[]>([]);
  const [draft, setDraft] = useState("");
  const [supported, setSupported] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [shared, setShared] = useState(false);

  const thread = [...seeded, ...added];
  const supportCount = post.support + (supported ? 1 : 0);
  const commentCount = post.comments + added.length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setAdded((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        author: { bn: "আপনি", en: "You", initials: "আপ" },
        time: { bn: "এইমাত্র", en: "just now" },
        body: { bn: body, en: body },
      },
    ]);
    setDraft("");
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: post.title.en, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* dismissed */
    }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  return (
    <AppShell title={{ bn: "পোস্ট বিস্তারিত", en: "Post detail" }} showBack hideComposer showSearch={false}>
      <article className="rounded-[1.75rem] border border-border bg-card p-5 shadow-card">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span lang="bn" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-base font-bold text-primary">
              {post.author.initials}
            </span>
            <div className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span lang="bn" className="truncate text-sm font-bold">{post.author.bn}</span>
                {post.author.verified && <BadgeCheck className="size-4 shrink-0 text-verified" />}
              </span>
              <span lang="en" className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                {post.author.en}
              </span>
            </div>
          </div>
          <span className={cn("shrink-0 rounded-full px-3 py-1.5 text-center", toneClass[meta.tone])}>
            <span lang="bn" className="block text-[11px] font-bold leading-none">{meta.bn}</span>
            <span lang="en" className="block text-[8px] uppercase tracking-wider opacity-80">{meta.en}</span>
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            <span lang="bn" className="font-medium">{post.location.bn}</span>
            <span lang="en" className="opacity-70">· {post.location.en}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            <span lang="bn" className="font-medium">{post.time.bn}</span>
            <span lang="en" className="opacity-70">· {post.time.en}</span>
          </span>
        </div>

        <h2 lang="bn" className="mt-4 text-2xl font-bold leading-snug tracking-tight">{post.title.bn}</h2>
        <p lang="en" className="mt-1 text-sm font-medium text-muted-foreground">{post.title.en}</p>

        <p lang="bn" className="mt-4 text-[15px] leading-relaxed text-foreground/90">{post.body.bn}</p>
        <p lang="en" className="mt-2 text-xs leading-relaxed text-muted-foreground">{post.body.en}</p>

        {images.length > 0 && (
          <div className={cn("mt-4 grid gap-1.5 overflow-hidden rounded-2xl", images.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setLightbox(i)}
                className={cn(
                  "group/media relative aspect-square overflow-hidden bg-surface",
                  images.length === 3 && i === 0 && "col-span-2",
                )}
              >
                <img
                  src={src}
                  alt={`${post.title.en} — ${i + 1}`}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="size-full object-cover transition-transform duration-500 group-hover/media:scale-105"
                />
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span key={t.en} className="rounded-full border border-border bg-surface px-3 py-1 text-[11px]">
              <span lang="bn" className="font-semibold">#{t.bn}</span>
              <span lang="en" className="ml-1 text-muted-foreground">{t.en}</span>
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-surface px-4 py-3">
            <span lang="bn" className="block text-lg font-bold tabular-nums">{supportCount.toLocaleString("bn-BD")}</span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">Supports · সমর্থন</span>
          </div>
          <div className="rounded-2xl bg-surface px-4 py-3">
            <span lang="bn" className="block text-lg font-bold tabular-nums">{commentCount.toLocaleString("bn-BD")}</span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">Comments · মন্তব্য</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <button
            type="button"
            aria-pressed={supported}
            onClick={() => setSupported((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-brand-soft hover:text-primary",
              supported && "border-primary bg-brand-soft text-primary",
            )}
          >
            <Heart className={cn("size-4", supported && "fill-current")} />
            <span lang="bn" className="font-semibold">সমর্থন</span>
            <span lang="en" className="text-[10px] uppercase tracking-wider opacity-70">Support</span>
          </button>
          <button
            type="button"
            onClick={share}
            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-brand-soft hover:text-primary"
          >
            <Share2 className="size-4" />
            <span lang="bn" className="font-semibold">{shared ? "লিংক কপি হয়েছে" : "শেয়ার"}</span>
            <span lang="en" className="text-[10px] uppercase tracking-wider opacity-70">{shared ? "Copied" : "Share"}</span>
          </button>
          <span className={cn("ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold", status.cls)}>
            <BadgeCheck className="size-3.5" />
            <span lang="bn">{status.bn}</span>
            <span lang="en" className="opacity-70">· {status.en}</span>
          </span>
        </div>
      </article>

      <section className="mt-5 rounded-[1.75rem] border border-border bg-card p-5 shadow-card">
        <h3 lang="bn" className="flex items-center gap-2 text-base font-bold">
          <MessageCircle className="size-4 text-primary" />
          মন্তব্য ({commentCount.toLocaleString("bn-BD")})
        </h3>
        <p lang="en" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Comments</p>

        <form onSubmit={submit} className="mt-4 flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="মন্তব্য লিখুন · Write a comment"
            className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="মন্তব্য পাঠান / Send comment"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </form>

        <div className="mt-4 space-y-3">
          {thread.map((c) => (
            <div key={c.id} className="flex gap-3 rounded-2xl bg-surface p-4">
              <span lang="bn" className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-sm font-bold text-primary">
                {c.author.initials}
              </span>
              <div className="min-w-0">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span lang="bn" className="text-sm font-bold">{c.author.bn}</span>
                  <span lang="en" className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.author.en}</span>
                  <span lang="bn" className="text-[10px] text-muted-foreground">· {c.time.bn}</span>
                </span>
                <p lang="bn" className="mt-1 text-sm leading-relaxed text-foreground/90">{c.body.bn}</p>
                {c.body.en !== c.body.bn && (
                  <p lang="en" className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{c.body.en}</p>
                )}
              </div>
            </div>
          ))}
          {thread.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              <span lang="bn" className="font-semibold">প্রথম মন্তব্যটি করুন</span>
              <span lang="en" className="ml-1">· Be the first to comment</span>
            </p>
          )}
        </div>
      </section>

      {lightbox !== null && images[lightbox] && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-foreground/90 p-4" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          <img src={images[lightbox]} alt={post.title.en} className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </AppShell>
  );
}
