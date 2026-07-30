import { useState } from "react";
import { Droplet, Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BLOOD_GROUPS } from "@/services/emergency";
import { cn } from "@/lib/utils";

export interface BloodDraft {
  group: string;
  units: number;
  hospital: string;
  phone: string;
  note: string;
}

interface Props {
  open: boolean;
  areaLabel: { bn: string; en: string };
  submitting: boolean;
  onClose: () => void;
  onSubmit: (draft: BloodDraft) => void;
}

/** রক্তের জরুরি ডাক — blood alert composer. */
export function BloodAlertModal({ open, areaLabel, submitting, onClose, onSubmit }: Props) {
  const [group, setGroup] = useState<string>("O+");
  const [units, setUnits] = useState(1);
  const [hospital, setHospital] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const valid = hospital.trim().length > 1 && phone.trim().length >= 6;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-[2rem] p-5" data-testid="blood-modal">
        <DialogTitle className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-emergency-soft text-emergency">
            <Droplet className="size-5" />
          </span>
          <span>
            <span lang="bn" className="block text-lg font-bold">রক্তের জরুরি ডাক</span>
            <span lang="en" className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Blood alert
            </span>
          </span>
        </DialogTitle>

        <div className="mt-2">
          <p lang="bn" className="text-xs font-bold">রক্তের গ্রুপ</p>
          <p lang="en" className="text-[10px] uppercase tracking-wider text-muted-foreground">Blood group</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {BLOOD_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                data-testid={`blood-group-${g}`}
                onClick={() => setGroup(g)}
                className={cn(
                  "rounded-2xl border px-2 py-3 text-sm font-bold transition-all active:scale-95",
                  group === g
                    ? "border-emergency bg-emergency text-emergency-foreground shadow-lift"
                    : "border-border bg-card hover:border-emergency/40",
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p lang="bn" className="text-xs font-bold">কত ব্যাগ · Units needed</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setUnits((u) => Math.max(1, u - 1))}
              className="size-10 rounded-2xl border border-border bg-card text-lg font-bold active:scale-95"
            >
              −
            </button>
            <span data-testid="blood-units" className="min-w-8 text-center text-xl font-bold">{units}</span>
            <button
              type="button"
              onClick={() => setUnits((u) => Math.min(10, u + 1))}
              className="size-10 rounded-2xl border border-border bg-card text-lg font-bold active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        <label className="mt-4 block">
          <span lang="bn" className="text-xs font-bold">হাসপাতাল / ঠিকানা</span>
          <span lang="en" className="ml-1 text-[10px] uppercase tracking-wider text-muted-foreground">Hospital</span>
          <input
            data-testid="blood-hospital"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            placeholder="ঢাকা মেডিকেল কলেজ হাসপাতাল"
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-emergency"
          />
        </label>

        <label className="mt-3 block">
          <span lang="bn" className="text-xs font-bold">যোগাযোগ নম্বর</span>
          <span lang="en" className="ml-1 text-[10px] uppercase tracking-wider text-muted-foreground">Contact</span>
          <input
            data-testid="blood-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="01XXXXXXXXX"
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-emergency"
          />
        </label>

        <label className="mt-3 block">
          <span lang="bn" className="text-xs font-bold">বিস্তারিত</span>
          <span lang="en" className="ml-1 text-[10px] uppercase tracking-wider text-muted-foreground">Details</span>
          <textarea
            data-testid="blood-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="রোগীর অবস্থা, কখন প্রয়োজন…"
            className="mt-1.5 w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-emergency"
          />
        </label>

        <p className="mt-3 rounded-2xl bg-surface px-4 py-3 text-[11px] text-muted-foreground">
          <span lang="bn">এই ডাক পাবে · </span>
          <span lang="bn" className="font-bold text-foreground">{areaLabel.bn}</span>
          <span lang="en"> · {areaLabel.en}</span>
        </p>

        <button
          type="button"
          data-testid="blood-submit"
          disabled={!valid || submitting}
          onClick={() => onSubmit({ group, units, hospital: hospital.trim(), phone: phone.trim(), note: note.trim() })}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emergency px-4 py-4 text-sm font-bold text-emergency-foreground disabled:opacity-50 active:scale-95"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Droplet className="size-4" />}
          <span lang="bn">রক্তের ডাক পাঠান</span>
          <span lang="en" className="text-[10px] uppercase tracking-wider opacity-80">Broadcast blood alert</span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
