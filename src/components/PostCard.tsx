import { useState } from "react";
import { BadgeCheck, MapPin, Clock, Heart, MessageCircle, Paperclip, ShieldAlert, ShieldQuestion } from "lucide-react";
import { kindMeta, type Post } from "@/lib/civic";
import { cn } from "@/lib/utils";

const toneClass = {
  brand: "bg-brand-soft text-primary",
  emergency: "bg-emergency-soft text-emergency",
  verified: "bg-verified-soft text-verified",
  warning: "bg-warning-soft text-warning",
};

const levelLabel = {
  critical: { bn: "অতি জরুরি", en: "Critical" },
  high: { bn: "উচ্চ", en: "High" },
  moderate: { bn: "মাঝারি", en: "Moderate" },
};

export function PostCard({ post }: { post: Post }) {
  const meta = kindMeta[post.kind];
  const images = post.images ?? [];
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [supported, setSupported] = useState(false);

  return (
    <article
      className={cn(
        "group rounded-[1.75rem] border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift",
        post.kind === "emergency" && "border-emergency/30",
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            lang="bn"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-base font-bold text-primary"
          >
            {post.author.initials}
          </span>
          <div className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span lang="bn" className="truncate text-sm font-bold">
                {post.author.bn}
              </span>
              {post.author.verified && <BadgeCheck className="size-4 shrink-0 text-verified" />}
            </span>
            <span lang="en" className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground">
              {post.author.en}
            </span>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-3 py-1.5 text-center", toneClass[meta.tone])}>
          <span lang="bn" className="block text-[11px] font-bold leading-none">
            {meta.bn}
          </span>
          <span lang="en" className="block text-[8px] uppercase tracking-wider opacity-80">
            {meta.en}
          </span>
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
        </span>
      </div>

      <h3 lang="bn" className="mt-4 text-lg font-bold leading-snug tracking-tight">
        {post.title.bn}
      </h3>
      <p lang="en" className="mt-1 text-sm font-medium text-muted-foreground">
        {post.title.en}
      </p>

      <p lang="bn" className="mt-3 text-sm leading-relaxed text-foreground/85">
        {post.body.bn}
      </p>
      <p lang="en" className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {post.body.en}
      </p>

      {post.level && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emergency-soft px-4 py-3">
          <ShieldAlert className="size-4 shrink-0 text-emergency" />
          <span className="min-w-0">
            <span lang="bn" className="block text-xs font-bold text-emergency">
              জরুরি মাত্রা: {levelLabel[post.level].bn}
            </span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-emergency/70">
              Emergency level: {levelLabel[post.level].en}
            </span>
          </span>
        </div>
      )}

      {images.length > 0 && (
        <div
          className={cn(
            "mt-4 grid gap-1.5 overflow-hidden rounded-2xl",
            images.length === 1 && "grid-cols-1",
            images.length >= 2 && "grid-cols-2",
          )}
        >
          {images.slice(0, 4).map((src, i) => {
            const extra = i === 3 && images.length > 4 ? images.length - 4 : 0;
            return (
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
                {extra > 0 && (
                  <span className="absolute inset-0 grid place-items-center bg-foreground/60 text-xl font-bold text-background">
                    +{extra}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {lightbox !== null && images[lightbox] && (
        <div
          className="fixed inset-0 z-[120] grid place-items-center bg-foreground/90 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={images[lightbox]}
            alt={post.title.en}
            className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain"
          />
        </div>
      )}


      <div className="mt-4 flex flex-wrap gap-2">
        {post.tags.map((t) => (
          <span
            key={t.en}
            className="rounded-full border border-border bg-surface px-3 py-1 text-[11px]"
          >
            <span lang="bn" className="font-semibold">#{t.bn}</span>
            <span lang="en" className="ml-1 text-muted-foreground">{t.en}</span>
          </span>
        ))}
        {post.evidence ? (
          <span className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-muted-foreground">
            <Paperclip className="size-3" />
            <span lang="bn" className="font-semibold">{post.evidence}টি প্রমাণ</span>
            <span lang="en">Evidence</span>
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-pressed={supported}
            onClick={() => setSupported((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors hover:bg-brand-soft hover:text-primary",
              supported && "bg-brand-soft text-primary",
            )}
          >
            <Heart className={cn("size-4", supported && "fill-current")} />
            <span className="font-semibold tabular-nums">{(post.support + (supported ? 1 : 0)).toLocaleString("bn-BD")}</span>
            <span lang="bn" className="text-xs text-muted-foreground">সমর্থন</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors hover:bg-brand-soft hover:text-primary">
            <MessageCircle className="size-4" />
            <span className="font-semibold tabular-nums">{post.comments.toLocaleString("bn-BD")}</span>
            <span lang="bn" className="text-xs text-muted-foreground">মন্তব্য</span>
          </button>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold",
            post.status === "verified" && "bg-verified-soft text-verified",
            post.status === "pending" && "bg-warning-soft text-warning",
            post.status === "disputed" && "bg-emergency-soft text-emergency",
          )}
        >
          {post.status === "verified" ? (
            <BadgeCheck className="size-3.5" />
          ) : (
            <ShieldQuestion className="size-3.5" />
          )}
          <span lang="bn">
            {post.status === "verified" ? "যাচাইকৃত" : post.status === "pending" ? "যাচাই চলছে" : "বিতর্কিত"}
          </span>
        </span>
      </div>
    </article>
  );
}
