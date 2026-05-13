import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About Us",
  description:
    "Learn how RentItOut helps owners and renters connect for appliance rentals with transparent listings and direct contact.",
  path: "/about-us",
  keywords: ["about RentItOut", "appliance rental marketplace", "how RentItOut works"],
});

export default function AboutUsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="space-y-2 border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">RentItOut</p>
        <h1 className="text-3xl font-semibold text-zinc-950">About Us</h1>
        <p className="text-sm text-zinc-600">Last updated: May 13, 2026</p>
      </header>

      <article className="mt-8 space-y-6 text-sm leading-7 text-zinc-700">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">Who we are</h2>
          <p>
            RentItOut is an early-stage rental marketplace focused on helping people discover household appliances
            available for rent in their city. We connect owners and renters through clear listings and direct contact
            options.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">What we do</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Owners can publish listings with pricing, city, and agreement details.</li>
            <li>Renters can browse by category and city, then request owner contact details.</li>
            <li>Both sides can connect directly and complete rental agreements offline.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">Our approach</h2>
          <p>
            We focus on simple product flows, listing clarity, and user trust signals so renters can make faster
            decisions and owners can receive qualified rental inquiries.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">Contact</h2>
          <p>
            For partnership or general platform questions, email{" "}
            <a className="underline hover:no-underline" href="mailto:devashishshrivastavwork@gmail.com">
              devashishshrivastavwork@gmail.com
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
