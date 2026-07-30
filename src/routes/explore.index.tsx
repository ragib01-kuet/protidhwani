import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { Globe2, MapPin, Search } from "lucide-react";
import { feedPosts, type Post } from "@/lib/civic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explore/")({
  head: () => ({
    meta: [
      { title: "অন্বেষণ · Explore — Protidhwani" },
      { name: "description", content: "Explore verified civic reports, alerts and misinformation checks across Bangladesh." },
      { property: "og:title", content: "অন্বেষণ · Explore — Protidhwani" },
      { property: "og:description", content: "Verified civic reports, nearby alerts and misinformation checks." },
    ],
  }),
  component: Explore,
});

const chips = [
  { bn: "সব", en: "All", match: () => true },
  { bn: "যাচাইকৃত", en: "Verified", match: (p: Post) => p.status === "verified" },
  { bn: "জরুরি", en: "Emergency", match: (p: Post) => p.kind === "emergency" },
  { bn: "ভুল তথ্য", en: "Misinformation", match: (p: Post) => p.status !== "verified" },
  { bn: "অধিকার", en: "Rights", match: (p: Post) => p.kind === "rights" },
  { bn: "নিখোঁজ", en: "Missing", match: (p: Post) => p.kind === "missing" },
] as const;

const PAGE_SIZE = 6;

function Explore() {
  const [active, setActive] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // A single identity for "which feed am I paging through".
  const filterKey = `${active}::${query.trim().toLowerCase()}`;
  const keyRef = useRef(filterKey);
  const [renderedKey, setRenderedKey] = useState(filterKey);

  // Synchronous reset during render: page must never be carried over from a
  // previous filter, otherwise the first paint after a chip/search change
  // shows a deeper slice (and duplicate cards while the list re-keys).
  if (renderedKey !== filterKey) {
    keyRef.current = filterKey;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setRenderedKey(filterKey);
    setPage(1);
    setLoadingMore(false);
  }

  const matches = useMemo(() => {
    const chip = chips.find((c) => c.en === active) ?? chips[0];
    const term = query.trim().toLowerCase();
    return feedPosts.filter((p) => {
      if (!chip.match(p)) return false;
      if (!term) return true;
      return [p.title.bn, p.title.en, p.body.bn, p.body.en, p.location.bn, p.location.en, ...p.tags.flatMap((t) => [t.bn, t.en])]
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [active, query]);

  // Scroll the list back to its start after a filter/search change so the
  // sentinel is not already on screen (which would instantly auto-page).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 12;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const visible = useMemo(() => {
    const seen = new Set<string>();
    return matches.slice(0, page * PAGE_SIZE).filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [matches, page]);
  const hasMore = visible.length < matches.length;

  const loadMore = useCallback(() => {
    const startedFor = keyRef.current;
    setLoadingMore((busy) => {
      if (busy) return busy;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        // Drop a page bump that was scheduled for a filter the user left.
        if (keyRef.current !== startedFor) return;
        setPage((p) => p + 1);
        setLoadingMore(false);
      }, 350);
      return true;
    });
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "320px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore, filterKey]);

  return (
    <AppShell title={{ bn: "অন্বেষণ", en: "Explore" }}>
      <section className="mb-4 flex items-start gap-3 rounded-[1.75rem] border border-border bg-card p-4 shadow-card">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-primary">
          <Globe2 className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p lang="bn" className="text-sm font-bold">সারা দেশের ফিড</p>
          <p lang="en" className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Nationwide · reports from every district
          </p>
        </div>
        <Link
          to="/community"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-[11px] font-bold text-primary"
        >
          <MapPin className="size-3.5" />
          <span lang="bn">আমার এলাকা</span>
        </Link>
      </section>

      <label className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 shadow-card">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="খুঁজুন · Search reports, areas, tags"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {chips.map((c) => {
          const count = feedPosts.filter((p) => c.match(p)).length;
          return (
            <button
              key={c.en}
              onClick={() => setActive(c.en)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-left transition-all active:scale-95",
                active === c.en
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <span lang="bn" className="block text-xs font-bold leading-none">{c.bn} ({count})</span>
              <span lang="en" className="block text-[9px] uppercase tracking-wider opacity-70">{c.en}</span>
            </button>
          );
        })}
      </div>


      <section className="mt-5 rounded-[2rem] border border-border bg-card p-5 shadow-card">
        <h2 lang="bn" className="text-base font-bold">কাছের সতর্কতা</h2>
        <p lang="en" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Nearby Alerts</p>
        <div className="mt-4 space-y-3">
          {[
            { bn: "ধানমন্ডিতে জলাবদ্ধতা", en: "Waterlogging in Dhanmondi", tone: "warning" },
            { bn: "উত্তরায় ছিনতাইয়ের রিপোর্ট", en: "Snatching reported in Uttara", tone: "emergency" },
            { bn: "সদরঘাটে যাচাইকৃত ত্রাণ কেন্দ্র", en: "Verified relief centre at Sadarghat", tone: "verified" },
          ].map((a) => (
            <div key={a.en} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  a.tone === "warning" && "bg-warning",
                  a.tone === "emergency" && "bg-emergency pulse-ring",
                  a.tone === "verified" && "bg-verified",
                )}
              />
              <span className="min-w-0">
                <span lang="bn" className="block truncate text-sm font-semibold">{a.bn}</span>
                <span lang="en" className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground">{a.en}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div ref={listRef} className="mt-5 space-y-4">
        {visible.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        {hasMore && (
          <div ref={sentinelRef} className="py-2">
            <div className="rounded-[2rem] border border-border bg-card px-6 py-6 text-center">
              <p lang="bn" className="text-sm font-bold">
                {loadingMore ? "আরও পোস্ট লোড হচ্ছে…" : "আরও পোস্ট আছে"}
              </p>
              <p lang="en" className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                {loadingMore ? "Loading more posts" : `${matches.length - visible.length} more reports`}
              </p>
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="mt-4 rounded-full border border-border px-5 py-2 text-xs font-semibold transition-colors hover:border-primary/50 disabled:opacity-50"
              >
                <span lang="bn">আরও দেখুন</span>
                <span lang="en" className="ml-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Load more</span>
              </button>
            </div>
          </div>
        )}
        {!hasMore && visible.length > 0 && (
          <p className="py-4 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span lang="bn" className="mr-2 text-xs normal-case tracking-normal">সব পোস্ট দেখা হয়েছে</span>
            End of feed
          </p>
        )}
        {visible.length === 0 && (
          <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-10 text-center">
            <p lang="bn" className="text-sm font-bold">কোনো ফলাফল পাওয়া যায়নি</p>
            <p lang="en" className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">No matching reports</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
