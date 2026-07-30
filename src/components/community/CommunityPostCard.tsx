import { useState } from "react";
import {
  BadgeCheck,
  Clock,
  Flag,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Share2,
  ShieldAlert,
  ShieldQuestion,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  KIND_MAP,
  LEVEL_LABEL,
  STATUS_LABEL,
  TONE_CLASS,
  initialsFor,
  relativeTime,
  toBnNumber,
} from "@/lib/community-meta";
import { cn } from "@/lib/utils";
import type { PostWithAuthor } from "@/services/community";

export interface CommunityPostCardProps {
  post: PostWithAuthor;
  supported: boolean;
  flagged: boolean;
  isOwner: boolean;
  busy?: boolean;
  onSupport: (post: PostWithAuthor) => void;
  onComment: (post: PostWithAuthor) => void;
  onShare: (post: PostWithAuthor) => void;
  onFlag: (post: PostWithAuthor) => void;
  onEdit: (post: PostWithAuthor) => void;
  onDelete: (post: PostWithAuthor) => void;
}

export function CommunityPostCard({
  post,
  supported,
  flagged,
  isOwner,
  busy = false,
  onSupport,
  onComment,
  onShare,
  onFlag,
  onEdit,
  onDelete,
}: CommunityPostCardProps) {
  const meta = KIND_MAP[post.kind] ?? KIND_MAP.discussion;
  const status = STATUS_LABEL[post.status];
  const time = relativeTime(post.created_at);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const authorBn = post.author?.full_name_bn || post.author?.full_name || "নাগরিক";
  const authorEn = post.author?.full_name || post.author?.username || "Citizen";

  return (
    <article
      id={`post-${post.id}`}
      data-testid="community-post"
      className={cn(
        "group rounded-[1.75rem] border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift",
        post.kind === "emergency" && "border-emergency/30",
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {post.author?.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt={authorEn}
              className="size-11 shrink-0 rounded-2xl object-cover"
              loading="lazy"
            />
          ) : (
            <span
              lang="bn"
              className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-base font-bold text-primary"
            >
              {initialsFor(post.author?.full_name_bn ?? null, post.author?.full_name ?? null)}
            </span>
          )}
          <div className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span lang="bn" className="truncate text-sm font-bold">
                {authorBn}
              </span>
              {post.status === "verified" && (
                <BadgeCheck className="size-4 shrink-0 text-verified" aria-label="Verified" />
              )}
            </span>
            <span
              lang="en"
              className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              {authorEn}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("rounded-full px-3 py-1.5 text-center", TONE_CLASS[meta.tone])}>
            <span lang="bn" className="block text-[11px] font-bold leading-none">
              {meta.bn}
            </span>
            <span lang="en" className="block text-[8px] uppercase tracking-wider opacity-80">
              {meta.en}
            </span>
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="পোস্ট অপশন / Post options"
              className="grid size-9 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-primary"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => onShare(post)}>
                <Share2 className="size-4" />
                <span lang="bn">শেয়ার</span>
                <span lang="en" className="ml-auto text-[10px] text-muted-foreground">
                  Share
                </span>
              </DropdownMenuItem>
              {isOwner ? (
                <>
                  <DropdownMenuItem onSelect={() => onEdit(post)}>
                    <Pencil className="size-4" />
                    <span lang="bn">সম্পাদনা</span>
                    <span lang="en" className="ml-auto text-[10px] text-muted-foreground">
                      Edit
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => onDelete(post)}
                    className="text-emergency focus:text-emergency"
                  >
                    <Trash2 className="size-4" />
                    <span lang="bn">মুছে ফেলুন</span>
                    <span lang="en" className="ml-auto text-[10px] opacity-70">
                      Delete
                    </span>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onSelect={() => onFlag(post)}>
                  <Flag className={cn("size-4", flagged && "text-emergency")} />
                  <span lang="bn">{flagged ? "রিপোর্ট করা হয়েছে" : "ভুল তথ্য রিপোর্ট"}</span>
                  <span lang="en" className="ml-auto text-[10px] text-muted-foreground">
                    Flag
                  </span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {(post.location || post.district) && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            <span lang="bn" className="font-medium">
              {post.location || post.district}
            </span>
            {post.district && post.location ? (
              <span lang="en" className="opacity-70">
                · {post.district}
              </span>
            ) : null}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" />
          <span lang="bn" className="font-medium">
            {time.bn}
          </span>
          <span lang="en" className="opacity-70">
            · {time.en}
          </span>
        </span>
      </div>

      <h3 lang="bn" className="mt-4 text-lg font-bold leading-snug tracking-tight">
        {post.title}
      </h3>
      {post.title_en && (
        <p lang="en" className="mt-1 text-sm font-medium text-muted-foreground">
          {post.title_en}
        </p>
      )}

      <p lang="bn" className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
        {post.body}
      </p>
      {post.body_en && (
        <p lang="en" className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
          {post.body_en}
        </p>
      )}

      {post.level && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emergency-soft px-4 py-3">
          <ShieldAlert className="size-4 shrink-0 text-emergency" />
          <span className="min-w-0">
            <span lang="bn" className="block text-xs font-bold text-emergency">
              জরুরি মাত্রা: {LEVEL_LABEL[post.level].bn}
            </span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-emergency/70">
              Emergency level: {LEVEL_LABEL[post.level].en}
            </span>
          </span>
        </div>
      )}

      {post.image_urls.length > 0 && (
        <div
          className={
            post.image_urls.length === 1
              ? "mt-4"
              : post.image_urls.length === 2
                ? "mt-4 grid grid-cols-2 gap-1.5"
                : "mt-4 grid grid-cols-2 gap-1.5"
          }
        >
          {post.image_urls.slice(0, 4).map((url, i) => {
            const count = Math.min(post.image_urls.length, 4);
            const single = count === 1;
            // Facebook/Instagram-style: single image is full-width 1:1,
            // a leading image in an odd 3-up grid spans both columns.
            const span = count === 3 && i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square";
            const extra = i === 3 && post.image_urls.length > 4 ? post.image_urls.length - 4 : 0;
            return (
              <button
                key={url}
                type="button"
                onClick={() => setLightbox(url)}
                aria-label="ছবি বড় করে দেখুন / Open image"
                className={`relative overflow-hidden border border-border ${
                  single ? "aspect-square w-full rounded-2xl" : `${span} rounded-xl`
                }`}
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                />
                {extra > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-foreground/60 text-xl font-bold text-background">
                    +{extra}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}


      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span
              key={t}
              lang="bn"
              className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border pt-4">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            data-testid="support-button"
            disabled={busy}
            onClick={() => onSupport(post)}
            aria-pressed={supported}
            aria-label="সমর্থন / Support"
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors hover:bg-brand-soft hover:text-primary disabled:opacity-60",
              supported && "bg-brand-soft text-primary",
            )}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Heart className={cn("size-4", supported && "fill-current")} />
            )}
            <span className="font-semibold tabular-nums">{toBnNumber(post.support_count)}</span>
            <span lang="bn" className="text-xs text-muted-foreground">
              সমর্থন
            </span>
          </button>
          <button
            type="button"
            data-testid="comment-button"
            onClick={() => onComment(post)}
            aria-label="মন্তব্য / Comments"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors hover:bg-brand-soft hover:text-primary"
          >
            <MessageCircle className="size-4" />
            <span className="font-semibold tabular-nums">{toBnNumber(post.comment_count)}</span>
            <span lang="bn" className="text-xs text-muted-foreground">
              মন্তব্য
            </span>
          </button>
          <button
            type="button"
            onClick={() => onShare(post)}
            aria-label="শেয়ার / Share"
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-brand-soft hover:text-primary"
          >
            <Share2 className="size-4" />
          </button>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold",
            status.cls,
          )}
        >
          {post.status === "verified" ? (
            <BadgeCheck className="size-3.5" />
          ) : (
            <ShieldQuestion className="size-3.5" />
          )}
          <span lang="bn">{status.bn}</span>
        </span>
      </div>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-6"
        >
          <img src={lightbox} alt="" className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </article>
  );
}
