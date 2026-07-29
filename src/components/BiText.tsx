import { cn } from "@/lib/utils";

type Props = {
  bn: string;
  en: string;
  className?: string;
  bnClassName?: string;
  enClassName?: string;
  as?: "div" | "span" | "h1" | "h2" | "h3" | "p";
};

/** Bangla-dominant bilingual text block used everywhere in Protidhwani. */
export function BiText({
  bn,
  en,
  className,
  bnClassName,
  enClassName,
  as: Tag = "div",
}: Props) {
  return (
    <Tag className={cn("leading-tight", className)}>
      <span
        lang="bn"
        className={cn("block font-semibold tracking-tight", bnClassName)}
      >
        {bn}
      </span>
      <span
        lang="en"
        className={cn(
          "mt-0.5 block text-[0.72em] font-medium uppercase tracking-[0.08em] text-muted-foreground",
          enClassName,
        )}
      >
        {en}
      </span>
    </Tag>
  );
}
