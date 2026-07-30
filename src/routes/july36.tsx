import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download } from "lucide-react";
import pdfAsset from "@/assets/july-shahid-volume-04.pdf.asset.json";

export const Route = createFileRoute("/july36")({
  head: () => ({
    meta: [
      { title: "জুলাই ৩৬ · July 36 — History | Protidhwani" },
      {
        name: "description",
        content:
          "জুলাই অভ্যুত্থানের শহীদদের স্মরণে · A public archive of the martyrs of the July revolution in Bangladesh.",
      },
      { property: "og:title", content: "জুলাই ৩৬ · July 36 — History" },
      {
        property: "og:description",
        content:
          "জুলাই অভ্যুত্থানের শহীদদের স্মরণে · A public archive of the martyrs of the July revolution in Bangladesh.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: July36Page,
});

function July36Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border glass-panel">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              aria-label="ফিরে যান / Back to home"
              className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div className="min-w-0">
              <h1 lang="bn" className="truncate text-xl font-bold tracking-tight">
                জুলাই ৩৬ · ইতিহাস
              </h1>
              <p
                lang="en"
                className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
              >
                July 36 — History
              </p>
            </div>
          </div>
          <a
            href={pdfAsset.url}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary sm:inline-flex"
          >
            <span lang="bn">নতুন ট্যাবে খুলুন</span>
          </a>
          <a
            href={pdfAsset.url}
            download
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Download className="size-4" />
            <span lang="bn">ডাউনলোড</span>
            <span lang="en" className="hidden sm:inline text-primary-foreground/80">
              Download
            </span>
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">
        <p lang="bn" className="text-base font-semibold">
          শহীদদের স্মরণে
        </p>
        <p lang="en" className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          In memory of the martyrs of the July uprising
        </p>

        <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <object
            data={pdfAsset.url}
            type="application/pdf"
            className="h-[75vh] min-h-[460px] w-full"
            aria-label="July Shahid volume 04 PDF"
          >
            <iframe
              src={pdfAsset.url}
              title="July Shahid volume 04"
              className="h-[75vh] min-h-[460px] w-full"
            />
            <div className="p-6 text-sm text-muted-foreground">
              <span lang="bn">পিডিএফ দেখা যাচ্ছে না। </span>
              <a
                href={pdfAsset.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary underline"
              >
                Open the PDF
              </a>
            </div>
          </object>
        </div>
      </main>

      <footer className="border-t border-border px-4 py-5 text-center">
        <p className="text-[11px] text-muted-foreground">
          PDF credit: Bangladesh Jamaat-e-Islami
        </p>
      </footer>
    </div>
  );
}
