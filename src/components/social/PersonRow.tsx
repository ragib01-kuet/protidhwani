import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { personName, type PersonCard } from "@/services/social";
import { cn } from "@/lib/utils";

export function Avatar({ person, size = 44 }: { person: PersonCard; size?: number }) {
  const name = personName(person);
  const initial = (name.bn || name.en).trim().charAt(0);
  return person.avatar_url ? (
    <img
      src={person.avatar_url}
      alt={`${name.bn} ${name.en}`}
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial || "?"}
    </span>
  );
}

export function PersonRow({
  person,
  meta,
  actions,
  className,
}: {
  person: PersonCard;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const name = personName(person);
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-card p-3",
        className,
      )}
    >
      <Link to="/u/$userId" params={{ userId: person.id }} aria-label={`${name.bn} ${name.en}`}>
        <Avatar person={person} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to="/u/$userId" params={{ userId: person.id }} className="block">
          <p lang="bn" className="truncate text-sm font-semibold hover:text-primary">
            {name.bn}
          </p>
          <p lang="en" className="truncate text-xs text-muted-foreground">
            {name.en}
            {person.district ? ` · ${person.district}` : ""}
          </p>
        </Link>
        {meta ? <div className="mt-1 text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Shown when friends/messages are running on the built-in demo network. */
export function DemoNotice() {
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <p lang="bn" className="font-semibold">
        নমুনা প্রতিবেশী দেখানো হচ্ছে
      </p>
      <p lang="en" className="mt-1 text-xs text-muted-foreground">
        Live accounts are active. Some of your connections are sample neighbours kept on this
        device — friend requests and messages with real Protidhwani accounts sync to your account
        everywhere.
      </p>
    </div>
  );
}

