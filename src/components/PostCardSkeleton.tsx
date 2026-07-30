import { cn } from "@/lib/utils";

/**
 * Placeholder that mirrors the PostCard layout (avatar + meta, title, body,
 * 1:1 media, action row) so the feed does not jump while the next page loads.
 */
export function PostCardSkeleton({ withMedia = true }: { withMedia?: boolean }) {
  return (
    <article
      aria-hidden="true"
      className="animate-pulse overflow-hidden rounded-[2rem] border border-border bg-card p-5 shadow-card"
    >
      <div className="flex items-center gap-3">
        <div className="size-11 shrink-0 rounded-2xl bg-surface" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-32 rounded-full bg-surface" />
          <div className="h-2.5 w-20 rounded-full bg-surface" />
        </div>
        <div className="h-6 w-16 rounded-full bg-surface" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-4 w-[85%] rounded-full bg-surface" />
        <div className="h-3 w-[70%] rounded-full bg-surface" />
      </div>

      {withMedia && <div className="mt-4 aspect-square w-full rounded-2xl bg-surface" />}

      <div className="mt-4 flex items-center gap-2">
        {[64, 64, 56].map((w, i) => (
          <div key={i} className={cn("h-8 rounded-full bg-surface")} style={{ width: w }} />
        ))}
      </div>
    </article>
  );
}

export function PostCardSkeletonList({ count }: { count: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="আরও পোস্ট লোড হচ্ছে · Loading more posts"
      className="space-y-4"
    >
      {Array.from({ length: Math.max(1, count) }, (_, i) => (
        <PostCardSkeleton key={i} withMedia={i % 2 === 0} />
      ))}
    </div>
  );
}
