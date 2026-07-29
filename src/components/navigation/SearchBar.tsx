import { useMemo, useRef, useState } from "react";
import { Clock, MapPin, Search, SlidersHorizontal, X } from "lucide-react";

import { searchEntries, useRecentSearches, useSearchIndex } from "@/hooks/useSafetyLayer";
import type { SearchEntry } from "@/types/safety";

/**
 * Bilingual group labels for the fixed result order:
 * area (১) → street/para (২) → service (৩).
 */
const KIND_LABELS: Record<SearchEntry["kind"], { bn: string; en: string; step: string }> = {
  area: { bn: "এলাকা", en: "Area", step: "১" },
  street: { bn: "সড়ক / পাড়া", en: "Street / Para", step: "২" },
  service: { bn: "সেবা", en: "Service", step: "৩" },
};

export interface SearchBarProps {
  /** Fired when a suggestion is chosen — the page flies the map and opens the sheet. */
  onSelect: (entry: SearchEntry) => void;
  /** Optional trailing filter affordance (shows/hides the layer + time panels). */
  onFilter?: () => void;
}

/** Fully client-side fuzzy search over seeded areas + services. No geocoding API. */
export function SearchBar({ onSelect, onFilter }: SearchBarProps) {
  const index = useSearchIndex();
  const { recent, pushRecent } = useRecentSearches();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = useMemo(() => searchEntries(index, query), [index, query]);
  const showRecents = focused && query.trim().length === 0 && recent.length > 0;
  const showResults = focused && results.length > 0;

  function choose(entry: SearchEntry) {
    pushRecent(entry.nameBn);
    setQuery(entry.nameBn);
    setFocused(false);
    onSelect(entry);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 shadow-lift backdrop-blur">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
            setFocused(true);
          }}
          // Delay blur so a click on a suggestion still registers.
          onBlur={() => {
            blurTimer.current = setTimeout(() => setFocused(false), 120);
          }}
          placeholder="জেলা, এলাকা, থানা…"
          aria-label="এলাকা বা সেবা খুঁজুন / Search area or service"
          className="min-h-14 w-full bg-transparent text-[15px] font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground"
        />
        {query ? (
          <button
            onClick={() => setQuery("")}
            aria-label="খোঁজ মুছুন / Clear search"
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        ) : (
          onFilter && (
            <button
              onClick={onFilter}
              aria-label="ফিল্টার দেখান বা লুকান / Toggle filters"
              className="grid size-9 shrink-0 place-items-center rounded-full text-foreground hover:bg-secondary"
            >
              <SlidersHorizontal className="size-5" />
            </button>
          )
        )}
      </div>


      {(showResults || showRecents) && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
          {showResults && (
            /* Explicit sort disclosure so users know why results are ordered this way. */
            <p className="flex flex-wrap items-center gap-1 border-b border-border bg-secondary/60 px-4 py-2">
              <span lang="bn" className="text-[11px] font-bold">
                ক্রম: এলাকা → সড়ক/পাড়া → সেবা
              </span>
              <span lang="en" className="text-[10px] text-muted-foreground">
                Sorted: Area → Street/Para → Service
              </span>
            </p>
          )}

          <ul>
            {showRecents &&
              recent.map((term) => (
                <li key={term}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setQuery(term)}
                    className="flex min-h-11 w-full items-center gap-2 px-4 py-2 text-left hover:bg-secondary"
                  >
                    <Clock className="size-3.5 text-muted-foreground" aria-hidden />
                    <span lang="bn" className="text-sm">
                      {term}
                    </span>
                  </button>
                </li>
              ))}

            {showResults &&
              results.map((entry, i) => {
                // Insert a group heading whenever the result kind changes.
                const isGroupStart = i === 0 || results[i - 1].kind !== entry.kind;
                const group = KIND_LABELS[entry.kind];
                return (
                  <li key={entry.id}>
                    {isGroupStart && (
                      <p className="flex items-baseline gap-1.5 px-4 pb-1 pt-2">
                        <span lang="bn" className="text-[11px] font-bold text-primary">
                          {group.bn}
                        </span>
                        <span
                          lang="en"
                          className="text-[10px] uppercase tracking-wider text-muted-foreground"
                        >
                          {group.en}
                        </span>
                        <span
                          aria-hidden
                          className="ml-auto text-[10px] font-semibold text-muted-foreground"
                        >
                          {group.step}
                        </span>
                      </p>
                    )}
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(entry)}
                      className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left hover:bg-secondary"
                    >
                      <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span lang="bn" className="block truncate text-sm font-bold">
                          {entry.nameBn}
                        </span>
                        <span lang="bn" className="block truncate text-[11px] text-muted-foreground">
                          {entry.subtitleBn}
                          <span lang="en"> · {entry.subtitleEn}</span>
                        </span>
                      </span>
                      <span
                        lang="bn"
                        className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground"
                      >
                        {group.bn}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

    </div>
  );
}
