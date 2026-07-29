import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { posts, composerOptions } from "@/lib/civic";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "কমিউনিটি · Community — Protidhwani" },
      { name: "description", content: "Community feed of civic reports, discussions, polls and events from across Bangladesh." },
      { property: "og:title", content: "কমিউনিটি · Community — Protidhwani" },
      { property: "og:description", content: "Reports, discussions, polls and events from citizens across Bangladesh." },
    ],
  }),
  component: Community,
});

function Community() {
  return (
    <AppShell title={{ bn: "কমিউনিটি", en: "Community" }}>
      <section className="rounded-[2rem] border border-border bg-card p-5 shadow-card">
        <h2 lang="bn" className="text-base font-bold">নাগরিক কম্পোজার</h2>
        <p lang="en" className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Civic Composer</p>
        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {composerOptions.map((o) => (
            <button
              key={o.en}
              className="flex w-24 shrink-0 flex-col items-center gap-1 rounded-3xl border border-border bg-surface px-2 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 active:scale-95"
            >
              <span className="text-xl">{o.icon}</span>
              <span lang="bn" className="text-xs font-bold leading-none">{o.bn}</span>
              <span lang="en" className="text-[8px] uppercase tracking-wider text-muted-foreground">{o.en}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-5 space-y-4">
        {[...posts].reverse().map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </AppShell>
  );
}
