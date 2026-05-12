import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms and Conditions",
  description: "Read RentItOut terms covering platform usage, listing responsibilities, and legal limitations.",
  path: "/terms-and-conditions",
  keywords: ["rental marketplace terms", "RentItOut legal terms"],
});

export default function TermsAndConditionsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="space-y-2 border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Legal</p>
        <h1 className="text-3xl font-semibold text-zinc-950">Terms and Conditions</h1>
        <p className="text-sm text-zinc-600">Last updated: April 25, 2026</p>
      </header>

      <article className="mt-8 space-y-6 text-sm leading-7 text-zinc-700">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">1. Platform role</h2>
          <p>
            RentItOut is a connector platform where owners publish appliance listings and renters can discover listings
            and contact owners. RentItOut is not a party to offline rental agreements between users.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">2. Eligibility and account use</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>You must provide accurate registration details and keep your account information current.</li>
            <li>You are responsible for all activity under your account credentials.</li>
            <li>Do not share account access or use the platform for unlawful activity.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">3. Listings and user responsibility</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Owners are responsible for listing accuracy, pricing, condition, and availability details.</li>
            <li>Renters are responsible for independently verifying listing details before entering agreements.</li>
            <li>Both parties are responsible for any deposits, insurance, delivery, and handover terms they agree to.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">4. Payments and disputes</h2>
          <p>
            Rental payments and related transactions are handled directly between users unless explicitly stated
            otherwise. Disputes between users should be resolved by the involved parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">5. Prohibited behavior</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Posting false, misleading, or unlawful listings or content.</li>
            <li>Attempting to abuse the platform, bypass security, or scrape data without permission.</li>
            <li>Harassment, fraud, or any activity that violates applicable law.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">6. Suspension or termination</h2>
          <p>
            We may remove content, suspend, or terminate access to protect users and the platform, including for policy
            or legal violations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">7. Disclaimer and limitation of liability</h2>
          <p>
            The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the fullest extent
            permitted by law,
            RentItOut is not liable for losses resulting from user conduct, third-party actions, or offline rental
            arrangements between users.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">8. Changes to terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the platform after changes means you accept
            the updated terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">9. Contact</h2>
          <p>
            For terms-related questions, contact{" "}
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
