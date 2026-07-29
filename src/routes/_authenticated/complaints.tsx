import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowBigUp, Loader2, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/integrations/supabase/client";
import {
  createComplaint,
  deleteComplaint,
  listCategories,
  listComplaints,
  listMyVotedComplaintIds,
  toggleVote,
  uploadComplaintImage,
} from "@/services/civic";

export const Route = createFileRoute("/_authenticated/complaints")({
  head: () => ({
    meta: [
      { title: "অভিযোগ Complaints — Protidhwani" },
      {
        name: "description",
        content: "Report civic issues with photos, and upvote complaints raised by your neighbours.",
      },
      { property: "og:title", content: "অভিযোগ Complaints — Protidhwani" },
      {
        property: "og:description",
        content: "Citizen complaints, verified and prioritised by community votes.",
      },
    ],
  }),
  component: ComplaintsPage,
});

const EMPTY = {
  title: "",
  description: "",
  category_id: "",
  location: "",
  district: "",
  image_url: "",
};

function ComplaintsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const complaintsQuery = useQuery({ queryKey: ["complaints"], queryFn: listComplaints });
  const votesQuery = useQuery({
    queryKey: ["my-votes", userId],
    queryFn: () => listMyVotedComplaintIds(userId),
    enabled: Boolean(userId),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["complaints"] });
    queryClient.invalidateQueries({ queryKey: ["my-votes", userId] });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createComplaint(userId, {
        title: form.title,
        description: form.description,
        category_id: form.category_id || null,
        location: form.location || null,
        district: form.district || null,
        image_url: form.image_url || null,
      }),
    onSuccess: () => {
      toast.success("অভিযোগ জমা হয়েছে — Complaint submitted");
      setForm(EMPTY);
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const voteMutation = useMutation({
    mutationFn: (id: string) => toggleVote(id, userId),
    onSuccess: refresh,
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteComplaint(id),
    onSuccess: () => {
      toast.success("মুছে ফেলা হয়েছে — Deleted");
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  async function handleImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    try {
      const url = await uploadComplaintImage(userId, file);
      setForm((prev) => ({ ...prev, image_url: url }));
      toast.success("ছবি যুক্ত হয়েছে — Photo attached");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const voted = new Set(votesQuery.data ?? []);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-8 pb-28">
      <header className="mb-6">
        <h1 lang="bn" className="text-2xl font-bold text-foreground">
          নাগরিক অভিযোগ
        </h1>
        <p lang="en" className="text-sm text-muted-foreground">
          Citizen complaints ·{" "}
          <Link to="/account" className="text-primary hover:underline">
            প্রোফাইল Profile
          </Link>
        </p>
      </header>

      <form
        className="mb-8 space-y-4 rounded-3xl border border-border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <div>
          <Label htmlFor="title">
            <span lang="bn">শিরোনাম</span> <span className="text-muted-foreground">Title</span>
          </Label>
          <Input
            id="title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="description">
            <span lang="bn">বিবরণ</span> <span className="text-muted-foreground">Description</span>
          </Label>
          <Textarea
            id="description"
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="category">
              <span lang="bn">শ্রেণি</span> <span className="text-muted-foreground">Category</span>
            </Label>
            <select
              id="category"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— নির্বাচন করুন Select —</option>
              {(categoriesQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_bn} {c.name_en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="location">
              <span lang="bn">এলাকা</span> <span className="text-muted-foreground">Location</span>
            </Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="district">
              <span lang="bn">জেলা</span> <span className="text-muted-foreground">District</span>
            </Label>
            <Input
              id="district"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-secondary">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            <span lang="bn">ছবি যোগ করুন</span> <span className="opacity-70">Add photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImage}
              disabled={uploading}
            />
          </label>
          {form.image_url ? (
            <img
              src={form.image_url}
              alt="Attached complaint evidence"
              className="size-12 rounded-lg object-cover"
              loading="lazy"
            />
          ) : null}
          <Button type="submit" disabled={createMutation.isPending} className="ml-auto">
            {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            <span lang="bn">জমা দিন</span> <span className="opacity-70">Submit</span>
          </Button>
        </div>
      </form>

      {complaintsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> লোড হচ্ছে — Loading complaints…
        </div>
      ) : complaintsQuery.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {getErrorMessage(complaintsQuery.error)}
        </div>
      ) : (complaintsQuery.data ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          <span lang="bn">এখনো কোনো অভিযোগ নেই</span> — No complaints yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {(complaintsQuery.data ?? []).map((c) => (
            <li key={c.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => voteMutation.mutate(c.id)}
                  aria-label={`Upvote ${c.title}`}
                  className={`flex min-w-12 flex-col items-center rounded-xl border px-2 py-1.5 transition-colors ${
                    voted.has(c.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <ArrowBigUp className="size-5" />
                  <span className="text-xs font-bold">{c.vote_count ?? 0}</span>
                </button>
                <div className="min-w-0 flex-1">
                  <h2 lang="bn" className="truncate font-semibold text-foreground">
                    {c.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {c.categories ? `${c.categories.name_bn} ${c.categories.name_en} · ` : ""}
                    {c.location ?? "—"} · {c.status}
                  </p>
                </div>
                {c.user_id === userId ? (
                  <button
                    type="button"
                    aria-label={`Delete ${c.title}`}
                    onClick={() => deleteMutation.mutate(c.id)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
