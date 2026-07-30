import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ImagePlus, Loader2, Play, RotateCw, X } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DISTRICTS, POST_KINDS, TONE_CLASS } from "@/lib/community-meta";
import { cn } from "@/lib/utils";
import type { CommunityPostKind, CommunityPostLevel } from "@/integrations/supabase/database.types";
import {
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
  isVideoUrl,
  type MediaUploadProgress,
  type PostInput,
  type PostWithAuthor,
} from "@/services/community";

export interface PostComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the composer edits this post instead of creating a new one. */
  editing?: PostWithAuthor | null;
  initialKind?: CommunityPostKind;
  submitting: boolean;
  /** Per-file upload state, indexed against the selected files. */
  uploadProgress?: MediaUploadProgress[];
  onSubmit: (input: PostInput, files: File[], removedUrls: string[]) => Promise<void>;
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}


const EMPTY = {
  title: "",
  title_en: "",
  body: "",
  body_en: "",
  location: "",
  district: "",
  tags: "",
  level: "" as "" | CommunityPostLevel,
};

const fieldClass =
  "w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-primary/60";

export function PostComposerModal({
  open,
  onOpenChange,
  editing,
  initialKind = "report",
  submitting,
  onSubmit,
}: PostComposerModalProps) {
  const [kind, setKind] = useState<CommunityPostKind>(initialKind);
  const [form, setForm] = useState({ ...EMPTY });
  const [files, setFiles] = useState<File[]>([]);
  const [keptUrls, setKeptUrls] = useState<string[]>([]);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFiles([]);
    setRemovedUrls([]);
    if (editing) {
      setKind(editing.kind);
      setKeptUrls(editing.image_urls ?? []);
      setForm({
        title: editing.title,
        title_en: editing.title_en ?? "",
        body: editing.body,
        body_en: editing.body_en ?? "",
        location: editing.location ?? "",
        district: editing.district ?? "",
        tags: (editing.tags ?? []).join(", "),
        level: editing.level ?? "",
      });
    } else {
      setKind(initialKind);
      setKeptUrls([]);
      setForm({ ...EMPTY });
    }
  }, [open, editing, initialKind]);

  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
    );
    if (picked.length === 0) {
      setError("শুধু ছবি বা ভিডিও দিন · Only photos or videos are supported");
      return;
    }
    const tooBig = picked.find((f) =>
      f.type.startsWith("video/") ? f.size > VIDEO_MAX_BYTES : f.size > IMAGE_MAX_BYTES,
    );
    if (tooBig) {
      setError(
        "ছবি সর্বোচ্চ ৫ এমবি, ভিডিও সর্বোচ্চ ৫০ এমবি · Photos up to 5 MB, videos up to 50 MB",
      );
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, ...picked].slice(0, 6));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = form.title.trim();
    const body = form.body.trim();
    if (title.length < 3 || title.length > 200) {
      setError("শিরোনাম ৩–২০০ অক্ষরের হতে হবে · Title must be 3–200 characters");
      return;
    }
    if (body.length < 5 || body.length > 5000) {
      setError("বিবরণ কমপক্ষে ৫ অক্ষর (সর্বোচ্চ ৫০০০) · Description must be 5–5000 characters");
      return;
    }
    setError(null);

    await onSubmit(
      {
        kind,
        title,
        title_en: form.title_en.trim() || null,
        body,
        body_en: form.body_en.trim() || null,
        location: form.location.trim() || null,
        district: form.district || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 8),
        image_urls: keptUrls,
        level: form.level ? (form.level as CommunityPostLevel) : null,
      },
      files,
      removedUrls,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto rounded-[1.75rem] p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <DialogTitle asChild>
            <span className="block">
              <span lang="bn" className="block text-lg font-bold">
                {editing ? "পোস্ট সম্পাদনা" : "নাগরিক কম্পোজার"}
              </span>
              <span
                lang="en"
                className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
              >
                {editing ? "Edit post" : "Civic Composer"}
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <fieldset>
            <legend lang="bn" className="mb-2 text-xs font-bold">
              ধরন <span lang="en" className="font-normal text-muted-foreground">· Type</span>
            </legend>
            <div className="grid grid-cols-4 gap-2">
              {POST_KINDS.map((o) => (
                <button
                  key={o.kind}
                  type="button"
                  onClick={() => setKind(o.kind)}
                  aria-pressed={kind === o.kind}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border border-border bg-surface px-1 py-2.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 active:scale-95",
                    kind === o.kind && cn("border-transparent", TONE_CLASS[o.tone]),
                  )}
                >
                  <span className="text-lg">{o.icon}</span>
                  <span lang="bn" className="text-[10px] font-bold leading-none">
                    {o.bn}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span lang="bn" className="mb-1 block text-xs font-bold">
              শিরোনাম (বাংলা) *
            </span>
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="সংক্ষেপে কী ঘটেছে?"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span lang="en" className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
              Title (English)
            </span>
            <input
              value={form.title_en}
              onChange={(e) => set("title_en", e.target.value)}
              placeholder="Short English title"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span lang="bn" className="mb-1 block text-xs font-bold">
              বিবরণ (বাংলা) *
            </span>
            <textarea
              required
              rows={4}
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="বিস্তারিত লিখুন…"
              className={cn(fieldClass, "resize-y")}
            />
          </label>
          <label className="block">
            <span lang="en" className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
              Description (English)
            </span>
            <textarea
              rows={3}
              value={form.body_en}
              onChange={(e) => set("body_en", e.target.value)}
              className={cn(fieldClass, "resize-y")}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span lang="bn" className="mb-1 block text-xs font-bold">
                এলাকা <span lang="en" className="font-normal text-muted-foreground">· Area</span>
              </span>
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="মিরপুর ১০"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span lang="bn" className="mb-1 block text-xs font-bold">
                জেলা <span lang="en" className="font-normal text-muted-foreground">· District</span>
              </span>
              <select
                value={form.district}
                onChange={(e) => set("district", e.target.value)}
                className={fieldClass}
              >
                <option value="">নির্বাচন করুন · Select</option>
                {DISTRICTS.map((d) => (
                  <option key={d.en} value={d.en}>
                    {d.bn} · {d.en}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span lang="bn" className="mb-1 block text-xs font-bold">
              ট্যাগ <span lang="en" className="font-normal text-muted-foreground">· Tags (comma separated)</span>
            </span>
            <input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="জলাবদ্ধতা, সড়ক"
              className={fieldClass}
            />
          </label>

          {(kind === "emergency" || kind === "missing") && (
            <label className="block">
              <span lang="bn" className="mb-1 block text-xs font-bold">
                জরুরি মাত্রা{" "}
                <span lang="en" className="font-normal text-muted-foreground">· Urgency</span>
              </span>
              <select
                value={form.level}
                onChange={(e) => set("level", e.target.value)}
                className={fieldClass}
              >
                <option value="">নির্বাচন করুন · Select</option>
                <option value="critical">অতি জরুরি · Critical</option>
                <option value="high">উচ্চ · High</option>
                <option value="moderate">মাঝারি · Moderate</option>
              </select>
            </label>
          )}

          <div>
            <span lang="bn" className="mb-2 block text-xs font-bold">
              ছবি ও ভিডিও{" "}
              <span lang="en" className="font-normal text-muted-foreground">
                · Photos &amp; videos (max 6)
              </span>
            </span>
            <div className="flex flex-wrap gap-2">
              {keptUrls.map((url) => (
                <span key={url} className="relative size-20 overflow-hidden rounded-2xl border border-border">
                  {isVideoUrl(url) ? (
                    <>
                      <video src={url} muted playsInline className="size-full object-cover" />
                      <span className="pointer-events-none absolute inset-0 grid place-items-center bg-foreground/25 text-background">
                        <Play className="size-5 fill-current" />
                      </span>
                    </>
                  ) : (
                    <img src={url} alt="" className="size-full object-cover" />
                  )}
                  <button
                    type="button"
                    aria-label="ছবি সরান / Remove image"
                    onClick={() => {
                      setKeptUrls((prev) => prev.filter((u) => u !== url));
                      setRemovedUrls((prev) => [...prev, url]);
                    }}
                    className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-background/90"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {files.map((file, i) => (
                <span
                  key={`${file.name}-${i}`}
                  className="relative size-20 overflow-hidden rounded-2xl border border-border"
                >
                  {file.type.startsWith("video/") ? (
                    <>
                      <video
                        src={URL.createObjectURL(file)}
                        muted
                        playsInline
                        className="size-full object-cover"
                      />
                      <span className="pointer-events-none absolute inset-0 grid place-items-center bg-foreground/25 text-background">
                        <Play className="size-5 fill-current" />
                      </span>
                    </>
                  ) : (
                    <img src={URL.createObjectURL(file)} alt="" className="size-full object-cover" />
                  )}
                  <button
                    type="button"
                    aria-label="ছবি সরান / Remove image"
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-background/90"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {keptUrls.length + files.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="grid size-20 place-items-center rounded-2xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  aria-label="ছবি বা ভিডিও যোগ করুন / Add photo or video"
                >
                  <ImagePlus className="size-5" />
                </button>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-2xl bg-emergency-soft px-4 py-3 text-xs text-emergency">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full border border-border px-4 py-3 text-sm font-semibold transition-colors hover:bg-surface"
            >
              <span lang="bn">বাতিল</span>{" "}
              <span lang="en" className="text-xs text-muted-foreground">
                Cancel
              </span>
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              <span lang="bn">{editing ? "সংরক্ষণ" : "প্রকাশ করুন"}</span>
              <span lang="en" className="text-[10px] uppercase tracking-wider opacity-80">
                {editing ? "Save" : "Publish"}
              </span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
