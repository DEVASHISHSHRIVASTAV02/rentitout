import type { Metadata } from "next";
import { RentalComplianceWorkflow } from "@/components/rental-compliance-workflow";

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
      "Detailed legal template with risk, liability, default, termination, and dispute-resolution clauses for higher-value rentals.",
    href: "/legal-templates/appliance-rental-agreement-comprehensive.docx",
    filenameLabel: "appliance-rental-agreement-comprehensive.docx",
    highlights: [
      "Fixed-term and renewal structure",
      "Security deposit and deduction rules",
      "Repairs, damage, and indemnity clauses",
      "Arbitration and jurisdiction placeholders",
    ],
  },
  {
    title: "Short-Form Appliance Rental Agreement",
    description:
      "Lightweight template for quick rentals when both parties want a shorter, plain-language agreement with core protections.",
    href: "/legal-templates/appliance-rental-agreement-short-form.docx",
    filenameLabel: "appliance-rental-agreement-short-form.docx",
    highlights: [
      "Simple payment and tenure terms",
      "Condition, return, and late-fee language",
      "Basic default and termination protections",
      "Easy to edit in notes or Word",
    ],
  },
  {
    title: "Handover and Condition Checklist",
    description:
      "Inspection addendum for handover and return. Attach this to any agreement to reduce disputes about condition and missing accessories.",
    href: "/legal-templates/appliance-handover-checklist.docx",
    filenameLabel: "appliance-handover-checklist.docx",
    highlights: [
      "Pre-handover condition checklist",
      "Accessories and serial-number log",
      "Photo-evidence reminders",
      "Sign-off blocks for both parties",
    ],
  },
];

export const metadata: Metadata = {
  title: "Rental Agreement Templates | RentItOut",
  description:
    "Download editable appliance rental agreement templates and handover checklists for offline renter-owner contracts.",
};

export default function RentalAgreementTemplatesPage() {
  return (
    <div className="w-full px-4 py-10 sm:px-6 sm:py-12">
      <header className="space-y-3 border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Legal Tools</p>
        <h1 className="text-3xl font-semibold text-zinc-950">Rental Agreement Templates</h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-700">
          Download editable templates, fill the placeholders, and execute offline between owner and renter. These
          templates are a strong starting point but are not legal advice.
        </p>
        <p className="text-xs text-zinc-500">Last updated: May 11, 2026</p>
      </header>

      <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">Important legal note</p>
        <p className="mt-1">
          Laws vary by state and transaction type. Before signing, have a qualified advocate review final terms,
          stamp-duty requirements, and enforceability details for your jurisdiction.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
        <p className="font-semibold text-zinc-950">Privacy note</p>
        <p className="mt-1">
          The compliance workflow below runs only in your browser. We do not store, submit, or sync the checklist
          inputs to our servers.
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
        <h2 className="text-lg font-semibold text-zinc-950">Recommended signing workflow</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-700">
          <li>Download the relevant agreement template and fill all blanks before sharing.</li>
          <li>Attach appliance photos, invoice copy, serial numbers, and the handover checklist.</li>
          <li>Verify party identity documents and addresses before any payment or handover.</li>
          <li>Sign each page, keep witness signatures, and retain one fully signed copy per party.</li>
          <li>Use digital and printed records for rent receipts, extensions, and return confirmation.</li>
        </ol>
      </section>
    </div>
  );
}
