import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, Loader2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { relativeTime, toBnNumber } from "@/lib/community-meta";
import { listNotifications, markNotificationRead } from "@/services/civic";
import { cn } from "@/lib/utils";

/** Header bell with the signed-in user's latest notifications. */
export function NotificationsBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(user!.id),
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="বিজ্ঞপ্তি / Notifications"
        className="relative grid size-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-emergency px-1 text-[9px] font-bold leading-4 text-emergency-foreground">
            {toBnNumber(unread)}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-96 w-80 overflow-y-auto p-2">
        <p className="px-2 py-1.5">
          <span lang="bn" className="block text-sm font-bold">
            বিজ্ঞপ্তি
          </span>
          <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
            Notifications
          </span>
        </p>
        {!user ? (
          <Link
            to="/auth/login"
            className="mt-1 block rounded-xl bg-brand-soft px-3 py-3 text-center text-xs font-bold text-primary"
          >
            <span lang="bn">সাইন ইন করুন</span> ·{" "}
            <span lang="en" className="font-normal">
              Sign in
            </span>
          </Link>
        ) : isLoading ? (
          <p className="flex items-center gap-2 px-2 py-4 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> লোড হচ্ছে…
          </p>
        ) : items.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            <span lang="bn" className="block font-bold">
              নতুন কিছু নেই
            </span>
            <span lang="en">Nothing new</span>
          </p>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={async () => {
                if (!n.is_read) {
                  await markNotificationRead(n.id);
                  queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
                }
              }}
              className={cn(
                "block w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface",
                !n.is_read && "bg-brand-soft/60",
              )}
            >
              <span lang="bn" className="block text-xs font-bold">
                {n.title}
              </span>
              {n.body && <span className="mt-0.5 block text-[11px] text-muted-foreground">{n.body}</span>}
              <span lang="bn" className="mt-1 block text-[10px] text-muted-foreground">
                {relativeTime(n.created_at).bn}
              </span>
            </button>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
