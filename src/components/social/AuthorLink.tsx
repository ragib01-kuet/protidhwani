import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

/**
 * Facebook-style author lockup: tapping the avatar or the name opens that
 * citizen's profile. Falls back to a plain block when the post has no
 * resolvable author id (anonymous or legacy demo rows).
 */
export function AuthorLink({
  userId,
  children,
  className,
}: {
  userId?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const base = "flex min-w-0 items-center gap-3";
  if (!userId) return <div className={cn(base, className)}>{children}</div>;
  return (
    <Link
      to="/u/$userId"
      params={{ userId }}
      className={cn(
        base,
        "group/author rounded-2xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label="প্রোফাইল দেখুন · View profile"
    >
      {children}
    </Link>
  );
}
