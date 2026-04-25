import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | RentItOut",
  description: "How RentItOut collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="space-y-2 border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Legal</p>
        <h1 className="text-3xl font-semibold text-zinc-950">Privacy Policy</h1>
        <p className="text-sm text-zinc-600">Last updated: April 25, 2026</p>
      </header>

      <article className="mt-8 space-y-6 text-sm leading-7 text-zinc-700">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">1. About this policy</h2>
          <p>
            This policy explains how RentItOut collects, uses, and protects personal information when you use our
            website and services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">2. Information we collect</h2>
          <p>We may collect:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Account details, such as name, email address, and hashed password credentials.</li>
            <li>Listing details, photos, and profile contact preferences you provide.</li>
            <li>Technical data such as basic logs, browser metadata, and security/abuse-prevention signals.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">3. How we use your data</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>To create and manage your account and listings.</li>
            <li>To enable renter-owner contact based on your visibility settings.</li>
            <li>To send essential service emails such as OTP sign-in and listing proof notifications.</li>
            <li>To operate, improve, and secure the platform.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">4. Data sharing</h2>
          <p>
            We do not sell personal data. We share data only as needed with service providers that help run the
            platform (for example, hosting, database, and email providers), or when required by law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">5. Contact details shown on listings</h2>
          <p>
            RentItOut allows owners to control whether email and phone details are visible to renters. If you choose to
            reveal contact details, those details may be viewed by users who access your listing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">6. Data retention</h2>
          <p>
            We keep data for as long as needed to provide services, comply with legal obligations, resolve disputes, and
            enforce agreements.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">7. Security</h2>
          <p>
            We use reasonable technical and organizational measures to protect information. No online system can be
            guaranteed 100% secure, so users should also maintain strong account security practices.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">8. Your choices</h2>
          <p>
            You can update profile and listing information from your account. To request account-related help, contact
            us at{" "}
            <a className="underline hover:no-underline" href="mailto:devashishshrivastavwork@gmail.com">
              devashishshrivastavwork@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">9. Policy updates</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be reflected on this page with an
            updated effective date.
          </p>
        </section>
      </article>
    </div>
  );
}
