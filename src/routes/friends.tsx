import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Loader2, MessageCircle, Search, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { DemoNotice, PersonRow } from "@/components/social/PersonRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/integrations/supabase/client";
import {
  getSocialGraph,
  removeLink,
  respondToRequest,
  searchPeople,
  sendFriendRequest,
  stateFor,
  subscribeToFriendLinks,
  type PersonCard,
} from "@/services/social";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "বন্ধুরা Friends — Protidhwani" },
      {
        name: "description",
        content: "Find neighbours, send friend requests and grow your civic network on Protidhwani.",
      },
      { property: "og:title", content: "বন্ধুরা Friends — Protidhwani" },
      {
        property: "og:description",
        content: "Send and accept friend requests across the Protidhwani civic network.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FriendsPage,
});

type Tab = "friends" | "requests" | "discover";

function FriendsPage() {
  const { user } = useAuth();
  const meId = user?.id ?? "demo-me";
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("friends");
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(t);
  }, [term]);

  const graphQuery = useQuery({
    queryKey: ["social-graph", meId],
    queryFn: () => getSocialGraph(meId),
    enabled: Boolean(meId),
    retry: false,
  });

  useEffect(() => {
    if (!meId) return;
    return subscribeToFriendLinks(meId, () => {
      void queryClient.invalidateQueries({ queryKey: ["social-graph", meId] });
    });
  }, [meId, queryClient]);

  const searchQuery = useQuery({
    queryKey: ["people-search", meId, debounced],
    queryFn: () => searchPeople(meId, debounced),
    enabled: Boolean(meId) && tab === "discover",
    retry: false,
  });

  const graph = graphQuery.data;
  const schemaMissing = false;
  const demoMode = Boolean(graph?.demo);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["social-graph", meId] });
    void queryClient.invalidateQueries({ queryKey: ["people-search"] });
  };

  const addMutation = useMutation({
    mutationFn: (peerId: string) => sendFriendRequest(meId, peerId),
    onSuccess: () => {
      toast.success("অনুরোধ পাঠানো হয়েছে · Friend request sent");
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "declined" }) =>
      respondToRequest(id, status, meId),
    onSuccess: (_d, v) => {
      toast.success(
        v.status === "accepted"
          ? "বন্ধু হিসেবে যুক্ত · Friend added"
          : "অনুরোধ বাতিল · Request declined",
      );
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeLink(id, meId),
    onSuccess: () => {
      toast.success("সংযোগ সরানো হয়েছে · Connection removed");
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const busy = addMutation.isPending || respondMutation.isPending || removeMutation.isPending;

  const results = useMemo(() => {
    const people = (searchQuery.data ?? []) as PersonCard[];
    return people.map((p) => {
      const link = graph?.byPeer.get(p.id) ?? null;
      return { person: p, link, state: stateFor(link, meId) };
    });
  }, [searchQuery.data, graph, meId]);

  const tabs: { id: Tab; bn: string; en: string; count?: number }[] = [
    { id: "friends", bn: "বন্ধুরা", en: "Friends", count: graph?.friends.length },
    {
      id: "requests",
      bn: "অনুরোধ",
      en: "Requests",
      count: (graph?.incoming.length ?? 0) + (graph?.outgoing.length ?? 0),
    },
    { id: "discover", bn: "খুঁজুন", en: "Discover" },
  ];

  return (
    <AppShell
      title={{ bn: "বন্ধুরা", en: "Friends" }}
      subtitle="Civic network"
      hideComposer
      showSearch={false}
    >
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 pb-28">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                tab === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <span lang="bn" className="font-semibold">
                {t.bn}
              </span>{" "}
              <span lang="en" className="text-xs">
                {t.en}
              </span>
              {t.count ? <span className="ml-1 text-xs">({t.count})</span> : null}
            </button>
          ))}
        </div>

        {demoMode ? <DemoNotice /> : null}

        {graphQuery.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> লোড হচ্ছে · Loading
          </p>
        ) : null}

        {!schemaMissing && tab === "friends" ? (
          <section className="space-y-2">
            {graph?.friends.length ? (
              graph.friends.map((f) => (
                <PersonRow
                  key={f.id}
                  person={f}
                  actions={
                    <>
                      <Button asChild size="sm" variant="secondary">
                        <Link to="/messages" search={{ peer: f.id }}>
                          <MessageCircle className="size-4" />
                          <span className="sr-only">বার্তা Message</span>
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => f.link && removeMutation.mutate(f.link.id)}
                        aria-label="বন্ধু সরান · Unfriend"
                      >
                        <UserMinus className="size-4" />
                      </Button>
                    </>
                  }
                />
              ))
            ) : (
              <EmptyState
                bn="এখনো কোনো বন্ধু নেই"
                en="No friends yet — use Discover to find people."
              />
            )}
          </section>
        ) : null}

        {!schemaMissing && tab === "requests" ? (
          <section className="space-y-4">
            <div className="space-y-2">
              <SectionTitle bn="আসা অনুরোধ" en="Incoming requests" />
              {graph?.incoming.length ? (
                graph.incoming.map((p) => (
                  <PersonRow
                    key={p.id}
                    person={p}
                    actions={
                      <>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            p.link &&
                            respondMutation.mutate({ id: p.link.id, status: "accepted" })
                          }
                        >
                          <Check className="size-4" /> গ্রহণ
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() =>
                            p.link &&
                            respondMutation.mutate({ id: p.link.id, status: "declined" })
                          }
                          aria-label="বাতিল · Decline"
                        >
                          <X className="size-4" />
                        </Button>
                      </>
                    }
                  />
                ))
              ) : (
                <EmptyState bn="নতুন অনুরোধ নেই" en="No incoming requests." />
              )}
            </div>
            <div className="space-y-2">
              <SectionTitle bn="পাঠানো অনুরোধ" en="Sent requests" />
              {graph?.outgoing.length ? (
                graph.outgoing.map((p) => (
                  <PersonRow
                    key={p.id}
                    person={p}
                    meta={<span lang="en">Pending · অপেক্ষমাণ</span>}
                    actions={
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => p.link && removeMutation.mutate(p.link.id)}
                      >
                        বাতিল Cancel
                      </Button>
                    }
                  />
                ))
              ) : (
                <EmptyState bn="কোনো অনুরোধ পাঠানো হয়নি" en="You have not sent any requests." />
              )}
            </div>
          </section>
        ) : null}

        {!schemaMissing && tab === "discover" ? (
          <section className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="নাম বা এলাকা খুঁজুন · Search name, username or district"
                className="pl-9"
              />
            </div>
            {searchQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">খোঁজা হচ্ছে · Searching…</p>
            ) : null}
            {results.length ? (
              results.map(({ person, link, state }) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  actions={
                    state === "friends" ? (
                      <Button asChild size="sm" variant="secondary">
                        <Link to="/messages" search={{ peer: person.id }}>
                          <MessageCircle className="size-4" /> বার্তা
                        </Link>
                      </Button>
                    ) : state === "outgoing" ? (
                      <Button size="sm" variant="ghost" disabled>
                        অপেক্ষমাণ Pending
                      </Button>
                    ) : state === "incoming" ? (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          link && respondMutation.mutate({ id: link.id, status: "accepted" })
                        }
                      >
                        <Check className="size-4" /> গ্রহণ Accept
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => addMutation.mutate(person.id)}
                      >
                        <UserPlus className="size-4" /> যোগ Add
                      </Button>
                    )
                  }
                />
              ))
            ) : searchQuery.isSuccess ? (
              <EmptyState bn="কাউকে পাওয়া যায়নি" en="No people matched that search." />
            ) : null}
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

function SectionTitle({ bn, en }: { bn: string; en: string }) {
  return (
    <h2 className="text-sm font-semibold">
      <span lang="bn">{bn}</span>{" "}
      <span lang="en" className="text-xs font-normal text-muted-foreground">
        {en}
      </span>
    </h2>
  );
}

function EmptyState({ bn, en }: { bn: string; en: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-6 text-center">
      <p lang="bn" className="text-sm font-semibold">
        {bn}
      </p>
      <p lang="en" className="mt-1 text-xs text-muted-foreground">
        {en}
      </p>
    </div>
  );
}
