import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, MapPin, MessageCircle, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/social/PersonRow";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/integrations/supabase/client";
import { getPerson } from "@/services/messages";
import {
  findLink,
  personName,
  removeLink,
  respondToRequest,
  sendFriendRequest,
  stateFor,
} from "@/services/social";

export const Route = createFileRoute("/u/$userId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "নাগরিক প্রোফাইল · Citizen profile — Protidhwani" },
      {
        name: "description",
        content:
          "View a Protidhwani citizen profile, send a friend request and start a private message.",
      },
      { property: "og:title", content: "নাগরিক প্রোফাইল · Citizen profile — Protidhwani" },
      {
        property: "og:description",
        content: "Connect with neighbours on the Protidhwani civic network.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PersonProfile,
});

function PersonProfile() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const meId = user?.id ?? "demo-me";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const personQuery = useQuery({
    queryKey: ["person", userId],
    queryFn: () => getPerson(userId),
    retry: false,
  });

  const linkQuery = useQuery({
    queryKey: ["person-link", meId, userId],
    queryFn: () => findLink(meId, userId),
    enabled: Boolean(meId) && meId !== userId,
    retry: false,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["person-link", meId, userId] });
    void queryClient.invalidateQueries({ queryKey: ["social-graph", meId] });
  };

  const addMutation = useMutation({
    mutationFn: () => sendFriendRequest(meId, userId),
    onSuccess: () => {
      toast.success("অনুরোধ পাঠানো হয়েছে · Friend request sent");
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const respondMutation = useMutation({
    mutationFn: (status: "accepted" | "declined") =>
      respondToRequest(linkQuery.data!.id, status, meId),
    onSuccess: (_d, status) => {
      toast.success(
        status === "accepted" ? "বন্ধু হিসেবে যুক্ত · Friend added" : "অনুরোধ বাতিল · Declined",
      );
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const removeMutation = useMutation({
    mutationFn: () => removeLink(linkQuery.data!.id, meId),
    onSuccess: () => {
      toast.success("সংযোগ সরানো হয়েছে · Connection removed");
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const person = personQuery.data ?? null;
  const name = personName(person);
  const state = stateFor(linkQuery.data ?? null, meId);
  const isMe = meId === userId;
  const busy = addMutation.isPending || respondMutation.isPending || removeMutation.isPending;

  return (
    <AppShell
      title={{ bn: name.bn, en: name.en }}
      subtitle="Citizen profile"
      showBack
      showSearch={false}
      hideComposer
    >
      {personQuery.isLoading ? (
        <p className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> লোড হচ্ছে · Loading…
        </p>
      ) : !person ? (
        <div className="rounded-[2rem] border border-dashed border-border p-10 text-center">
          <p lang="bn" className="font-semibold">
            এই নাগরিককে পাওয়া যায়নি
          </p>
          <p lang="en" className="mt-1 text-xs text-muted-foreground">
            This citizen profile is not available.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-[2rem] border border-border bg-card p-6 text-center shadow-card">
            <div className="flex justify-center">
              <Avatar person={person} size={88} />
            </div>
            <h2 lang="bn" className="mt-4 text-xl font-bold">
              {name.bn}
            </h2>
            <p lang="en" className="text-sm text-muted-foreground">
              {name.en}
              {person.username ? ` · @${person.username}` : ""}
            </p>
            {person.district ? (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-primary">
                <MapPin className="size-3" /> {person.district}
              </p>
            ) : null}

            {isMe ? (
              <div className="mt-5">
                <Button asChild variant="secondary">
                  <Link to="/profile">নিজের প্রোফাইল · Edit my profile</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {state === "friends" ? (
                  <>
                    <Button onClick={() => navigate({ to: "/messages", search: { peer: userId } })}>
                      <MessageCircle className="size-4" /> বার্তা Message
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => removeMutation.mutate()}
                    >
                      <UserMinus className="size-4" /> বন্ধু সরান Unfriend
                    </Button>
                  </>
                ) : state === "incoming" ? (
                  <>
                    <Button disabled={busy} onClick={() => respondMutation.mutate("accepted")}>
                      <Check className="size-4" /> গ্রহণ Accept
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => respondMutation.mutate("declined")}
                    >
                      <X className="size-4" /> বাতিল Decline
                    </Button>
                  </>
                ) : state === "outgoing" ? (
                  <Button variant="secondary" disabled={busy} onClick={() => removeMutation.mutate()}>
                    অপেক্ষমাণ Pending · বাতিল Cancel
                  </Button>
                ) : (
                  <>
                    <Button disabled={busy || !meId} onClick={() => addMutation.mutate()}>
                      <UserPlus className="size-4" /> বন্ধু হোন Add friend
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate({ to: "/messages", search: { peer: userId } })}
                    >
                      <MessageCircle className="size-4" /> বার্তা Message
                    </Button>
                  </>
                )}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-border bg-card p-5 shadow-card">
            <h3 lang="bn" className="text-sm font-bold">
              নাগরিক সংযোগ
            </h3>
            <p lang="en" className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Civic connection
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <span lang="bn">
                বন্ধু হলে সরাসরি বার্তা পাঠাতে পারবেন এবং এলাকার রিপোর্ট শেয়ার করতে পারবেন।
              </span>{" "}
              <span lang="en">
                Once connected you can send direct messages and share area reports.
              </span>
            </p>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm" variant="secondary">
                <Link to="/friends">বন্ধুরা Friends</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link to="/messages" search={{}}>
                  বার্তা Messages
                </Link>
              </Button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
