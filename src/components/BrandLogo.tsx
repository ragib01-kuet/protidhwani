import { cn } from "@/lib/utils";

/**
 * Protidhwani brand mark. Served from `public/logo.png` so it resolves on any
 * static host (Lovable, Netlify, custom domains) without bundler rewrites.
 */
export const LOGO_SRC = "/logo.png";

export function BrandLogo({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <img
      src={LOGO_SRC}
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      alt="প্রতিধ্বনি · Protidhwani logo"
      className={cn("object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function BrandLockup({
  size = 36,
  className,
  stacked = false,
}: {
  size?: number;
  className?: string;
  stacked?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2.5",
        stacked && "flex-col gap-1.5 text-center",
        className,
      )}
    >
      <BrandLogo size={size} />
      <span className={cn("leading-tight", stacked && "leading-snug")}>
        <span lang="bn" className="block text-[15px] font-bold tracking-tight">
          প্রতিধ্বনি
        </span>
        <span
          lang="en"
          className="block text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
        >
          Protidhwani
        </span>
      </span>
    </span>
  );
}
