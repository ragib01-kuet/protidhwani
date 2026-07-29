import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { initialsFor, relativeTime, toBnNumber } from "@/lib/community-meta";
import type { CommentWithAuthor, PostWithAuthor } from "@/services/community";

export interface CommentsSheetProps {
  post: PostWithAuthor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: CommentWithAuthor[];
  loading: boolean;
  posting: boolean;
  currentUserId: string | null;
  onSubmit: (body: string) => Promise<void>;
  onDelete: (comment: CommentWithAuthor) => void;
  onSignIn: () => void;
}

export function CommentsSheet({
  post,
  open,
  onOpenChange,
  comments,
  loading,
  posting,
  currentUserId,
  onSubmit,
  onDelete,
  onSignIn,
}: CommentsSheetProps) {
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setBody("");
  }, [open, post?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [comments.length]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    await onSubmit(text);
    setBody("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[85vh] flex-col gap-0 rounded-t-[1.75rem] p-0 sm:mx-auto sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border px-6 py-4 text-left">
          <SheetTitle asChild>
            <span className="block">
              <span lang="bn" className="block text-base font-bold">
                মন্তব্য ({toBnNumber(comments.length)})
              </span>
              <span
                lang="en"
                className="block truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
              >
                Comments · {post?.title_en ?? post?.title ?? ""}
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span lang="bn">লোড হচ্ছে…</span>
            </p>
          ) : comments.length === 0 ? (
            <p className="rounded-2xl bg-surface px-4 py-6 text-center">
              <span lang="bn" className="block text-sm font-bold">
                এখনও কোনো মন্তব্য নেই
              </span>
              <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                No comments yet
              </span>
            </p>
          ) : (
            comments.map((c) => {
              const time = relativeTime(c.created_at);
              return (
                <div key={c.id} className="flex items-start gap-3">
                  {c.author?.avatar_url ? (
                    <img
                      src={c.author.avatar_url}
                      alt=""
                      className="size-9 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span
                      lang="bn"
                      className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-xs font-bold text-primary"
                    >
                      {initialsFor(c.author?.full_name_bn ?? null, c.author?.full_name ?? null)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1 rounded-2xl bg-surface px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span lang="bn" className="truncate text-xs font-bold">
                        {c.author?.full_name_bn || c.author?.full_name || "নাগরিক"}
                      </span>
                      <span lang="bn" className="shrink-0 text-[10px] text-muted-foreground">
                        {time.bn}
                      </span>
                      {currentUserId === c.user_id && (
                        <button
                          type="button"
                          onClick={() => onDelete(c)}
                          aria-label="মন্তব্য মুছুন / Delete comment"
                          className="ml-auto shrink-0 text-muted-foreground transition-colors hover:text-emergency"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </span>
                    <p lang="bn" className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                      {c.body}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {currentUserId ? (
          <form onSubmit={send} className="flex items-end gap-2 border-t border-border px-6 py-4">
            <textarea
              rows={1}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="আপনার মন্তব্য লিখুন · Write a comment"
              className="max-h-28 min-h-11 flex-1 resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary/60"
            />
            <button
              type="submit"
              disabled={posting || !body.trim()}
              aria-label="মন্তব্য পাঠান / Send comment"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
            >
              {posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>
        ) : (
          <div className="border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onSignIn}
              className="w-full rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              <span lang="bn">মন্তব্য করতে সাইন ইন করুন</span>{" "}
              <span lang="en" className="text-[10px] uppercase tracking-wider opacity-80">
                Sign in to comment
              </span>
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
