import { useEffect, useState } from "react";
import { Loader2, MapPin, ShieldAlert, X } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toBnNumber } from "@/lib/community-meta";

interface Props {
  open: boolean;
  seconds?: number;
  areaLabel: { bn: string; en: string };
  locating: boolean;
  onCancel: () => void;
  onFire: () => void;
}

/** Five second hold before an SOS broadcasts — cancellable, Bangla dominant. */
export function SosCountdownModal({
  open,
  seconds = 5,
  areaLabel,
  locating,
  onCancel,
  onFire,
}: Props) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (!open) {
      setLeft(seconds);
      return;
    }
    setLeft(seconds);
    const started = Date.now();
    const timer = window.setInterval(() => {
      const remaining = seconds - Math.floor((Date.now() - started) / 1000);
      if (remaining <= 0) {
        window.clearInterval(timer);
        setLeft(0);
        onFire();
      } else {
        setLeft(remaining);
      }
    }, 200);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seconds]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent
        className="max-w-sm gap-0 overflow-hidden rounded-[2rem] border-none bg-emergency p-0 text-emergency-foreground"
        data-testid="sos-countdown"
      >
        <DialogTitle className="sr-only">এসওএস পাঠানো হচ্ছে · Sending SOS</DialogTitle>
        <div className="grid place-items-center gap-3 px-6 py-8 text-center">
          <span className="grid size-24 place-items-center rounded-full bg-emergency-foreground/15 pulse-ring text-4xl font-black">
            {toBnNumber(left)}
          </span>
          <p lang="bn" className="mt-2 text-2xl font-bold">এসওএস পাঠানো হচ্ছে</p>
          <p lang="en" className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">
            Broadcasting SOS to your community
          </p>
          <p className="mt-2 flex items-center gap-1.5 rounded-full bg-emergency-foreground/15 px-3 py-1.5 text-xs">
            {locating ? <Loader2 className="size-3.5 animate-spin" /> : <MapPin className="size-3.5" />}
            <span lang="bn">{areaLabel.bn}</span>
            <span lang="en" className="opacity-75">· {areaLabel.en}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] opacity-85">
            <ShieldAlert className="size-3.5" />
            <span lang="bn">লাইভ লোকেশন শেয়ার হবে</span>
            <span lang="en">· live location will be shared</span>
          </p>
          <button
            onClick={onCancel}
            data-testid="sos-cancel"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emergency-foreground px-4 py-3.5 text-sm font-bold text-emergency active:scale-95"
          >
            <X className="size-4" />
            <span lang="bn">বাতিল করুন</span>
            <span lang="en" className="text-[10px] uppercase tracking-wider opacity-70">Cancel</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
