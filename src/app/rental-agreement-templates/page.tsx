import type { Metadata } from "next";
import { RentalComplianceWorkflow } from "@/components/rental-compliance-workflow";
import { buildPageMetadata } from "@/lib/seo";

type AgreementTemplate = {
  title: string;
  description: string;
  href: string;
  filenameLabel: string;
  highlights: string[];
};

const templates: AgreementTemplate[] = [
  {
    title: "Comprehensive Appliance Rental Agreement",
    description:
      "A longer editable draft with schedules for the appliance, handover checklist, and photos. Covers term, rent, deposit, repairs, default, theft/loss, notices, stamp-duty reminder, and optional arbitration blanks.",
    href: "/legal-templates/appliance-rental-agreement-comprehensive.docx",
    filenameLabel: "appliance-rental-agreement-comprehensive.docx",
    highlights: [
      "Owner and renter identity fields",
      "Deposit settlement and deduction rules",
      "Repair, default, and recovery clauses",
      "Jurisdiction and optional arbitration blanks",
    ],
  },
  {
    title: "Short-Form Appliance Rental Agreement",
    description:
      "A shorter editable draft for simpler appliance rentals. Still includes party details, appliance schedule, rent, deposit, care, repairs, and signature blocks.",
    href: "/legal-templates/appliance-rental-agreement-short-form.docx",
    filenameLabel: "appliance-rental-agreement-short-form.docx",
    highlights: [
      "Clear party and appliance blanks",
      "Rent, deposit, and late-fee fields",
      "Use, repair, and return terms",
      "Owner, renter, and witness sign-off",
    ],
  },
  {
    title: "Handover and Condition Checklist",
    description:
      "A two-stage inspection sheet for handover and return: accessories, working checks, visible condition, photo reminders, and separate sign-off blocks.",
    href: "/legal-templates/appliance-handover-checklist.docx",
    filenameLabel: "appliance-handover-checklist.docx",
    highlights: [
      "Accessory and working-condition checks",
      "Handover and return photo prompts",
      "Defect and deduction discussion fields",
      "Separate owner and renter sign-off",
    ],
  },
];

export const metadata: Metadata = buildPageMetadata({
  title: "Rental Agreement Templates",
  description:
    "Download editable appliance rental agreement drafts and a handover checklist. Starting templates only, not legal advice.",
  path: "/rental-agreement-templates",
  keywords: ["rental agreement template", "appliance agreement", "handover checklist"],
});

export default function RentalAgreementTemplatesPage() {
  return (
    <div className="w-full px-4 py-10 sm:px-6 sm:py-12">
      <header className="space-y-3 border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Starting Drafts</p>
        <h1 className="text-3xl font-semibold text-zinc-950">Rental Agreement Templates</h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-700">
          Download editable Word drafts, fill every blank offline, and keep signed copies with both parties. These
          files are starting templates only. They are not lawyer-reviewed for your city, not stamped for you, and not
          legal advice.
        </p>
        <p className="text-xs text-zinc-500">Last updated: October 8, 2026</p>
      </header>

      <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">Important note</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            RentItOut is only a connector. We are not a party to any rental, we do not enforce agreements, and we do
            not provide insurance.
          </li>
          <li>
            These templates do not guarantee enforceability, stamp-duty compliance, registration, or dispute
            protection.
          </li>
          <li>
            Laws and stamp rules vary by state. Before signing, ask a qualified advocate about final wording,
            stamp duty, registration, and what applies where you are.
          </li>
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
        <p className="font-semibold text-zinc-950">Privacy note</p>
        <p className="mt-1">
          The optional checklist below runs only in your browser. We do not store, submit, or sync those inputs to
          our servers.
        </p>
      </section>

      <RentalComplianceWorkflow />

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <article key={template.title} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-950">{template.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-700">{template.description}</p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-zinc-700">
              {template.highlights.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <a
                href={template.href}
                download
                className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Download
              </a>
              <span className="text-xs text-zinc-500">{template.filenameLabel}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <h2 className="text-lg font-semibold text-zinc-950">Suggested offline steps</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-700">
          These are practical suggestions only. Your advocate or local rules may require different steps.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-700">
          <li>Download a draft and fill every blank before sharing it.</li>
          <li>Attach appliance photos, serial numbers, and the handover checklist if both sides agree.</li>
          <li>Confirm identity and contact details before any payment or handover.</li>
          <li>Sign the final version, keep a copy with each party, and record rent receipts and return notes.</li>
          <li>Ask a local advocate about stamp duty, registration, and whether the wording fits your state.</li>
        </ol>
      </section>
    </div>
  );
}
