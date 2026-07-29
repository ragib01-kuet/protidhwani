import { Crosshair, Layers, Minus, Plus } from "lucide-react";

export interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onToggleLayers: () => void;
  layersOpen: boolean;
}

/**
 * Stacked right-rail map controls: a joined zoom pair, then standalone
 * locate + layer buttons — matching the reference UI grouping.
 */
export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  onToggleLayers,
  layersOpen,
}: MapControlsProps) {
  return (
    <div className="pointer-events-auto flex flex-col items-end gap-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-lift backdrop-blur">
        <button
          onClick={onZoomIn}
          aria-label="জুম ইন / Zoom in"
          className="grid size-12 place-items-center text-foreground transition-colors hover:bg-secondary active:scale-95"
        >
          <Plus className="size-5" strokeWidth={2.2} />
        </button>
        <span className="block h-px w-full bg-border" aria-hidden />
        <button
          onClick={onZoomOut}
          aria-label="জুম আউট / Zoom out"
          className="grid size-12 place-items-center text-foreground transition-colors hover:bg-secondary active:scale-95"
        >
          <Minus className="size-5" strokeWidth={2.2} />
        </button>
      </div>

      <button
        onClick={onLocate}
        aria-label="আমার অবস্থান / My location"
        className="grid size-12 place-items-center rounded-2xl border border-border bg-card/95 text-primary shadow-lift backdrop-blur transition-transform active:scale-95"
      >
        <Crosshair className="size-5" />
      </button>

      <button
        onClick={onToggleLayers}
        aria-pressed={layersOpen}
        aria-label="স্তর দেখান বা লুকান / Toggle layers"
        className="grid size-12 place-items-center rounded-2xl border border-border bg-card/95 text-foreground shadow-lift backdrop-blur transition-transform active:scale-95"
      >
        <Layers className="size-5" />
      </button>
    </div>
  );
}
