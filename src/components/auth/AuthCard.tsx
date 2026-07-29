import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthCard({
  bn,
  en,
  subtitle,
  children,
  footer,
}: {
  bn: string;
  en: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex flex-col items-center gap-1">
          <span lang="bn" className="text-2xl font-bold tracking-tight text-primary">
            প্রতিধ্বনি
          </span>
          <span lang="en" className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            Protidhwani
          </span>
        </Link>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <header className="mb-6 text-center">
            <h1 lang="bn" className="text-xl font-bold text-foreground">
              {bn}
            </h1>
            <p lang="en" className="mt-1 text-sm text-muted-foreground">
              {en}
            </p>
            {subtitle ? <p className="mt-3 text-xs text-muted-foreground">{subtitle}</p> : null}
          </header>
          {children}
        </div>

        {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
      </div>
    </main>
  );
}

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

export function FormAlert({ tone, message }: { tone: "error" | "success"; message: string }) {
  return (
    <div
      role="alert"
      className={
        tone === "error"
          ? "mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          : "mb-4 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
      }
    >
      {message}
    </div>
  );
}
