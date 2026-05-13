import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Careers",
  description: "Explore current career opportunities at RentItOut.",
  path: "/careers",
  keywords: ["RentItOut careers", "jobs at RentItOut", "rental marketplace jobs"],
});

export default function CareersPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="space-y-2 border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">RentItOut</p>
        <h1 className="text-3xl font-semibold text-zinc-950">Careers</h1>
        <p className="text-sm text-zinc-600">Last updated: May 13, 2026</p>
      </header>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-950">No jobs posted right now</h2>
        <p className="mt-2 text-sm leading-7">
          We do not have any open roles at the moment. Please check this page again later for new opportunities.
        </p>
        <p className="mt-4 text-sm leading-7">
          You can still share your profile at{" "}
          <a className="underline hover:no-underline" href="mailto:devashishshrivastavwork@gmail.com">
            devashishshrivastavwork@gmail.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
