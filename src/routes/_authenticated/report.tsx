import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Crosshair,
  Loader2,
  MapPin,
  Send,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { BiText } from "@/components/BiText";
import {
  REPORT_CATEGORIES,
  matchCategoryId,
  type ReportCategory,
} from "@/components/reports/report-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resolveNearestArea } from "@/data/bd-areas";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { createComplaint, listCategories, uploadComplaintImage } from "@/services/civic";

export const Route = createFileRoute("/_authenticated/report")({
  head: () => ({
    meta: [
      { title: "ঘটনা রিপোর্ট Report an incident — Protidhwani" },
      {
        name: "description",
        content:
          "Report a civic incident in Bangladesh with a photo, precise location and category — reviewed by your community and local desks.",
      },
      { property: "og:title", content: "ঘটনা রিপোর্ট Report an incident — Protidhwani" },
      {
        property: "og:description",
        content: "Photo, location and category in three steps. Your neighbourhood sees it instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

interface GeoPoint {
  lat: number;
  lng: number;
  district: string | null;
  area: string | null;
}

const STEPS = [
  { bn: "ধরন", en: "Category" },
  { bn: "বিবরণ", en: "Details" },
  { bn: "নিশ্চিতকরণ", en: "Confirm" },
];

const MAX_IMAGE_MB = 5;

function ReportPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [manualPlace, setManualPlace] = useState("");
  const [geo, setGeo] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: listCategories });

  const locationLabel =
    manualPlace.trim() ||
    (geo ? [geo.area, geo.district].filter(Boolean).join(", ") : "") ||
    "";

  function captureLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("এই ডিভাইসে লোকেশন নেই · Location unavailable on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const near = resolveNearestArea(latitude, longitude);
        setGeo({
          lat: Number(latitude.toFixed(5)),
          lng: Number(longitude.toFixed(5)),
          district: near?.district.en ?? null,
          area: near?.union.en ?? null,
        });
        setLocating(false);
        toast.success("লোকেশন যুক্ত হয়েছে · Location attached");
      },
      () => {
        setLocating(false);
        toast.error(
          "লোকেশন পাওয়া যায়নি — এলাকার নাম লিখুন · Location denied, type the area instead",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("শুধু ছবি আপলোড করুন · Images only");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`ছবি ${MAX_IMAGE_MB} এমবি-র কম হতে হবে · Image must be under ${MAX_IMAGE_MB} MB`);
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      setImageUrl(await uploadComplaintImage(userId, file));
    } catch (error) {
      setImageUrl(null);
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  function clearPhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setImageUrl(null);
  }

  const submit = useMutation({
    mutationFn: async () => {
      if (!category) throw new Error("Choose a category first");
      const coords = geo ? `${geo.lat}, ${geo.lng}` : null;
      const place = locationLabel || null;
      return createComplaint(userId, {
        title: title.trim(),
        description: `${category.bn} ${category.en}\n\n${description.trim()}${
          coords ? `\n\nGPS: ${coords}` : ""
        }`,
        category_id: matchCategoryId(category, categoriesQuery.data ?? []),
        location: place ?? coords,
        district: geo?.district ?? null,
        image_url: imageUrl,
      });
    },
    onSuccess: (complaint) => {
      setReference(complaint.id);
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  function resetAll() {
    clearPhoto();
    setStep(0);
    setCategory(null);
    setTitle("");
    setDescription("");
    setManualPlace("");
    setGeo(null);
    setReference(null);
  }

  const detailsValid = title.trim().length >= 3 && description.trim().length >= 5;

  if (reference) {
    return (
      <AppShell title={{ bn: "রিপোর্ট জমা হয়েছে", en: "Report submitted" }} hideComposer showBack>
        <section className="rounded-3xl border border-border bg-card p-6 text-center shadow-card">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="size-7" />
          </span>
          <BiText
            as="h2"
            bn="আপনার রিপোর্ট গ্রহণ করা হয়েছে"
            en="Your report has been received"
            className="mt-4 text-xl"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            <span lang="bn" className="block">
              আপনার এলাকার প্রতিবেশী ও যাচাই ডেস্ক এটি দেখতে পাবে।
            </span>
            <span lang="en" className="block text-xs">
              Neighbours in your area and the verification desk can now see it.
            </span>
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-2 font-mono text-xs">
            <span className="uppercase tracking-widest text-muted-foreground">Ref</span>
            {reference.slice(0, 8).toUpperCase()}
          </p>
          {preview ? (
            <img
              src={preview}
              alt="Submitted incident photo"
              className="mx-auto mt-5 max-h-56 w-full rounded-2xl object-cover"
            />
          ) : null}
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" className="rounded-2xl">
              <Link to="/complaints">অভিযোগ দেখুন · View reports</Link>
            </Button>
            <Button className="rounded-2xl" onClick={resetAll}>
              আরেকটি রিপোর্ট · Report another
            </Button>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title={{ bn: "ঘটনা রিপোর্ট", en: "Report an incident" }} hideComposer showBack>
      <ol className="mb-5 flex items-center gap-2">
        {STEPS.map((s, index) => (
          <li key={s.en} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors",
                index < step && "border-primary bg-primary text-primary-foreground",
                index === step && "border-primary text-primary",
                index > step && "border-border text-muted-foreground",
              )}
            >
              {index < step ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span className="min-w-0 truncate text-xs">
              <span lang="bn" className="font-semibold">
                {s.bn}
              </span>{" "}
              <span className="text-muted-foreground">{s.en}</span>
            </span>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <BiText bn="ঘটনার ধরন বেছে নিন" en="Choose the incident type" className="text-lg" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {REPORT_CATEGORIES.map((item) => {
              const Icon = item.icon;
              const active = category?.key === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setCategory(item);
                    setStep(1);
                  }}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60",
                    active ? "border-primary bg-primary/5" : "border-border bg-background",
                  )}
                >
                  <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
                  <BiText bn={item.bn} en={item.en} className="text-sm" />
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === 1 && category ? (
        <section className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <BiText bn="কী ঘটেছে?" en="What happened?" className="text-lg" />
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="report-title">শিরোনাম · Title</Label>
                <Input
                  id="report-title"
                  value={title}
                  maxLength={200}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="সংক্ষেপে লিখুন · Short summary"
                  className="mt-1.5 rounded-2xl"
                />
              </div>
              <div>
                <Label htmlFor="report-body">বিস্তারিত · Description</Label>
                <Textarea
                  id="report-body"
                  value={description}
                  maxLength={5000}
                  rows={5}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="কখন, কোথায় এবং কী দেখলেন · When, where and what you saw"
                  className="mt-1.5 rounded-2xl"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <BiText bn="ছবি যুক্ত করুন" en="Add a photo" className="text-lg" />
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              className="hidden"
            />
            {preview ? (
              <div className="relative mt-4">
                <img
                  src={preview}
                  alt="Incident preview"
                  className="max-h-64 w-full rounded-2xl object-cover"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  aria-label="ছবি সরান / Remove photo"
                  className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-background/90 text-foreground shadow"
                >
                  <X className="size-4" />
                </button>
                {uploading ? (
                  <span className="absolute inset-0 grid place-items-center rounded-2xl bg-background/70 text-sm">
                    <Loader2 className="size-5 animate-spin" />
                  </span>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="mt-4 flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Camera className="size-6" />
                <BiText
                  bn="ছবি তুলুন বা আপলোড করুন"
                  en={`Take or upload a photo (max ${MAX_IMAGE_MB} MB)`}
                  className="text-sm"
                />
              </button>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <BiText bn="অবস্থান" en="Location" className="text-lg" />
            <Button
              type="button"
              variant="outline"
              onClick={captureLocation}
              disabled={locating}
              className="mt-4 w-full rounded-2xl"
            >
              {locating ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Crosshair className="mr-2 size-4" />
              )}
              বর্তমান অবস্থান · Use my location
            </Button>
            {geo ? (
              <p className="mt-3 flex items-start gap-2 rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {[geo.area, geo.district].filter(Boolean).join(", ") || "Pinned"} · {geo.lat},{" "}
                  {geo.lng}
                </span>
              </p>
            ) : null}
            <div className="mt-4">
              <Label htmlFor="report-place">এলাকা / রাস্তা · Area or street</Label>
              <Input
                id="report-place"
                value={manualPlace}
                onChange={(event) => setManualPlace(event.target.value)}
                placeholder="যেমন: মিরপুর ১০, ঢাকা · e.g. Mirpur 10, Dhaka"
                className="mt-1.5 rounded-2xl"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => setStep(0)}>
              <ChevronLeft className="mr-1 size-4" /> পেছনে · Back
            </Button>
            <Button
              className="flex-1 rounded-2xl"
              disabled={!detailsValid || uploading}
              onClick={() => setStep(2)}
            >
              পর্যালোচনা · Review
            </Button>
          </div>
        </section>
      ) : null}

      {step === 2 && category ? (
        <section className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <BiText bn="জমা দেওয়ার আগে দেখে নিন" en="Check before you submit" className="text-lg" />
            <dl className="mt-4 space-y-3 text-sm">
              <Row bn="ধরন" en="Category" value={`${category.bn} · ${category.en}`} />
              <Row bn="শিরোনাম" en="Title" value={title.trim()} />
              <Row bn="বিবরণ" en="Description" value={description.trim()} />
              <Row
                bn="অবস্থান"
                en="Location"
                value={
                  [locationLabel, geo ? `${geo.lat}, ${geo.lng}` : ""].filter(Boolean).join(" · ") ||
                  "যোগ করা হয়নি · Not added"
                }
              />
              <Row
                bn="ছবি"
                en="Photo"
                value={imageUrl ? "যুক্ত আছে · Attached" : "নেই · None"}
              />
            </dl>
            {preview ? (
              <img
                src={preview}
                alt="Incident preview"
                className="mt-4 max-h-56 w-full rounded-2xl object-cover"
              />
            ) : null}
            <p className="mt-4 rounded-2xl bg-amber-500/10 p-3 text-xs text-muted-foreground">
              <span lang="bn" className="block font-semibold text-foreground">
                সত্য তথ্য দিন
              </span>
              Reports are visible to your community and reviewed by verification desks.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => setStep(1)}
              disabled={submit.isPending}
            >
              <ChevronLeft className="mr-1 size-4" /> সম্পাদনা · Edit
            </Button>
            <Button
              className="flex-1 rounded-2xl"
              onClick={() => submit.mutate()}
              disabled={submit.isPending || !detailsValid}
            >
              {submit.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Send className="mr-2 size-4" />
              )}
              রিপোর্ট জমা দিন · Submit report
            </Button>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

function Row({ bn, en, value }: { bn: string; en: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-border/60 pb-3 last:border-0 last:pb-0 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <dt className="text-xs">
        <span lang="bn" className="font-semibold">
          {bn}
        </span>{" "}
        <span className="text-muted-foreground">{en}</span>
      </dt>
      <dd className="whitespace-pre-wrap break-words">{value}</dd>
    </div>
  );
}
