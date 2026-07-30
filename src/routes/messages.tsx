import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Send, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Avatar, DemoNotice, PersonRow } from "@/components/social/PersonRow";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/integrations/supabase/client";
import {
  getPerson,
  listConversation,
  listThreads,
  markThreadRead,
  sendMessage,
  subscribeToMessages,
} from "@/services/messages";
import { personName } from "@/services/social";

interface MessageSearch {
  peer?: string;
}

export const Route = createFileRoute("/messages")({
  validateSearch: (search: Record<string, unknown>): MessageSearch => ({
    peer: typeof search.peer === "string" && search.peer ? search.peer : undefined,
  }),
  head: () => ({
    meta: [
      { title: "বার্তা Messages — Protidhwani" },
      {
        name: "description",
        content: "Private bilingual messaging between Protidhwani citizens and neighbours.",
      },
      { property: "og:title", content: "বার্তা Messages — Protidhwani" },
      {
        property: "og:description",
        content: "Chat privately with your civic network on Protidhwani.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const meId = user?.id ?? "demo-me";
  const { peer: peerId } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const threadsQuery = useQuery({
    queryKey: ["dm-threads", meId],
    queryFn: () => listThreads(meId),
    enabled: Boolean(meId),
    retry: false,
  });

  const peerQuery = useQuery({
    queryKey: ["dm-peer", peerId],
    queryFn: () => getPerson(peerId!),
    enabled: Boolean(peerId),
    retry: false,
  });

  const convoQuery = useQuery({
    queryKey: ["dm-conversation", meId, peerId],
    queryFn: () => listConversation(meId, peerId!),
    enabled: Boolean(meId && peerId),
    retry: false,
  });

  useEffect(() => {
    if (!meId) return;
    return subscribeToMessages(meId, () => {
      void queryClient.invalidateQueries({ queryKey: ["dm-threads", meId] });
      void queryClient.invalidateQueries({ queryKey: ["dm-conversation", meId] });
    });
  }, [meId, queryClient]);

  // Mark the open thread read whenever new messages land in it.
  useEffect(() => {
    if (!meId || !peerId || !convoQuery.data?.length) return;
    const hasUnread = convoQuery.data.some((m) => m.recipient_id === meId && !m.read_at);
    if (!hasUnread) return;
    void markThreadRead(meId, peerId).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["dm-threads", meId] });
    });
  }, [meId, peerId, convoQuery.data, queryClient]);

  const schemaMissing = false;
  const demoMode = (threadsQuery.data ?? []).some((t) => t.peer.id.startsWith("demo-"));

  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [convoQuery.data?.length, peerId]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendMessage(meId, peerId!, body),
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["dm-conversation", meId, peerId] });
      void queryClient.invalidateQueries({ queryKey: ["dm-threads", meId] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const peer = peerQuery.data ?? null;
  const peerLabel = peer ? personName(peer) : null;

  return (
    <AppShell
      title={
        peerLabel
          ? { bn: peerLabel.bn, en: peerLabel.en }
          : { bn: "বার্তা", en: "Messages" }
      }
      subtitle={peerId ? "Direct message" : "Inbox"}
      hideComposer
      showSearch={false}
    >
      <div className="mx-auto max-w-3xl px-4 py-4 pb-28">
        {demoMode && !peerId ? <DemoNotice /> : null}

        {!schemaMissing && !peerId ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                <span lang="bn">কথোপকথন</span>{" "}
                <span lang="en" className="text-xs font-normal text-muted-foreground">
                  Conversations
                </span>
              </h2>
              <Button asChild size="sm" variant="secondary">
                <Link to="/friends">
                  <Users className="size-4" /> বন্ধুরা Friends
                </Link>
              </Button>
            </div>

            {threadsQuery.isLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> লোড হচ্ছে · Loading
              </p>
            ) : null}

            {threadsQuery.data?.length
              ? threadsQuery.data.map((t) => (
                  <Link key={t.peer.id} to="/messages" search={{ peer: t.peer.id }}>
                    <PersonRow
                      person={t.peer}
                      className="transition-colors hover:border-primary/50"
                      meta={
                        <span className="line-clamp-1">
                          {t.last.sender_id === meId ? "আপনি: " : ""}
                          {t.last.body}
                        </span>
                      }
                      actions={
                        t.unread ? (
                          <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {t.unread}
                          </span>
                        ) : null
                      }
                    />
                  </Link>
                ))
              : threadsQuery.isSuccess && (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                    <p lang="bn" className="text-sm font-semibold">
                      কোনো বার্তা নেই
                    </p>
                    <p lang="en" className="mt-1 text-xs text-muted-foreground">
                      Add friends first, then start a conversation.
                    </p>
                    <Button asChild size="sm" className="mt-3">
                      <Link to="/friends">বন্ধু খুঁজুন Find friends</Link>
                    </Button>
                  </div>
                )}
          </section>
        ) : null}

        {!schemaMissing && peerId ? (
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate({ to: "/messages", search: {} })}
              >
                <ArrowLeft className="size-4" /> ইনবক্স Inbox
              </Button>
              {peer ? <Avatar person={peer} size={28} /> : null}
            </div>

            <div className="min-h-[45vh] space-y-2 rounded-2xl border border-border bg-card p-3">
              {convoQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">লোড হচ্ছে · Loading</p>
              ) : null}
              {convoQuery.data?.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  <span lang="bn">প্রথম বার্তাটি লিখুন</span> · Say hello
                </p>
              ) : null}
              {convoQuery.data?.map((m) => {
                const mine = m.sender_id === meId;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          mine ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {mine && m.read_at ? " · পঠিত Read" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) sendMutation.mutate(draft);
              }}
            >
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                placeholder="বার্তা লিখুন · Write a message"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (draft.trim()) sendMutation.mutate(draft);
                  }
                }}
              />
              <Button type="submit" disabled={!draft.trim() || sendMutation.isPending}>
                {sendMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                <span className="sr-only">পাঠান Send</span>
              </Button>
            </form>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
