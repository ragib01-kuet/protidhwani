import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { Search } from "lucide-react";
import { posts, type Post } from "@/lib/civic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explore")({
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

function Explore() {
  const [active, setActive] = useState<string>("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const chip = chips.find((c) => c.en === active) ?? chips[0];
    const term = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (!chip.match(p)) return false;
      if (!term) return true;
      return [p.title.bn, p.title.en, p.body.bn, p.body.en, p.location.bn, p.location.en, ...p.tags.flatMap((t) => [t.bn, t.en])]
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [active, query]);

  return (
    <AppShell title={{ bn: "অন্বেষণ", en: "Explore" }}>
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
          const count = posts.filter((p) => c.match(p)).length;
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

      <div className="mt-5 space-y-4">
        {visible.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
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
