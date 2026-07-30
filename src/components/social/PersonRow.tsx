import type { ReactNode } from "react";

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
      <Avatar person={person} />
      <div className="min-w-0 flex-1">
        <p lang="bn" className="truncate text-sm font-semibold">
          {name.bn}
        </p>
        <p lang="en" className="truncate text-xs text-muted-foreground">
          {name.en}
          {person.district ? ` · ${person.district}` : ""}
        </p>
        {meta ? <div className="mt-1 text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SchemaNotice() {
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <p lang="bn" className="font-semibold">
        সামাজিক টেবিল এখনো তৈরি হয়নি
      </p>
      <p lang="en" className="mt-1 text-muted-foreground">
        Run <code className="rounded bg-background px-1">supabase/social.sql</code> in your Supabase
        SQL editor to enable friends and messaging.
      </p>
      <a href="/community" className="mt-3 inline-block text-xs font-semibold text-primary">
        কমিউনিটিতে ফিরুন · Back to community
      </a>
    </div>
  );
}
