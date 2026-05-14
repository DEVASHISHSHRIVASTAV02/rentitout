import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is RentItOut the owner of listed appliances?",
    answer:
      "No. RentItOut is a connector platform. Owners and renters finalize rent, deposit, delivery, and agreement terms directly with each other.",
  },
  {
    question: "How do I find the right appliance faster?",
    answer:
      "Use city and appliance shortcuts first, then apply filters in Browse for budget, agreement period, and listing ID to narrow down relevant options quickly.",
  },
  {
    question: "Why are owner contact details not shown immediately?",
    answer:
      "Contact details are gated behind reCAPTCHA verification to reduce spam and automated misuse. After successful verification, eligible contact fields are revealed.",
  },
  {
    question: "What should I confirm before paying any advance?",
    answer:
      "Confirm appliance condition, included accessories, delivery schedule, agreement duration, deposit refund terms, and damage rules. Keep written proof of all agreed points.",
  },
  {
    question: "Can I rent for a short duration like 1-3 months?",
    answer:
      "Many owners allow short terms, but it depends on each listing. Check listing details and reconfirm minimum duration with the owner before proceeding.",
  },
  {
    question: "I am an owner. Can I edit or remove my listing later?",
    answer:
      "Yes. Owners can update listing details from the dashboard and remove listings when an item is no longer available.",
  },
  {
    question: "Do you provide rental agreement templates?",
    answer:
      "Yes. RentItOut provides downloadable agreement templates and checklists as starting drafts that both parties can customize for their deal.",
  },
  {
    question: "How do I know if a listing is still available?",
    answer:
      "Availability can change quickly. Send an inquiry through the listing contact flow and reconfirm current status, earliest delivery date, and lock-in terms with the owner.",
  },
  {
    question: "What details should I ask the owner before finalizing?",
    answer:
      "Ask about appliance age, service history, warranty status, included accessories, transport charges, deposit deductions, repair responsibility, and return condition criteria.",
  },
  {
    question: "Can I inspect the appliance before delivery?",
    answer:
      "Yes, you should request current photos/videos and, where possible, a live demo or inspection. Record condition at handover to reduce disputes later.",
  },
  {
    question: "Are delivery and pickup charges included in rent?",
    answer:
      "Not always. Delivery and pickup may be extra or bundled depending on the owner. Confirm both one-way and return charges in writing before booking.",
  },
  {
    question: "How is the security deposit usually handled?",
    answer:
      "Deposits are generally collected by owners and refunded at return after condition checks. Confirm deduction rules, timelines, and payment mode before transfer.",
  },
  {
    question: "What if the appliance stops working during rental?",
    answer:
      "Service responsibility depends on your agreement with the owner. Clarify repair response time, replacement policy, and payment responsibility for damage vs normal wear.",
  },
  {
    question: "Can I extend my rental after the original term ends?",
    answer:
      "Usually yes, subject to owner approval and appliance availability. Discuss extension pricing and notice period at least a few days before term end.",
  },
  {
    question: "What happens if I want to return the appliance early?",
    answer:
      "Early return terms vary by owner. Some may allow prorated settlement, while others may apply minimum tenure or notice conditions. Confirm this before finalizing.",
  },
  {
    question: "Does RentItOut handle payments between renter and owner?",
    answer:
      "No. RentItOut does not process rental payments between parties. Payment terms are handled directly between renter and owner based on their agreement.",
  },
  {
    question: "How can owners get better response from renters?",
    answer:
      "Use clear titles, accurate pricing, recent photos, exact city/location hints, and transparent deposit and delivery terms. Complete listings generally get higher-quality inquiries.",
  },
  {
    question: "How can I stay safe while renting through RentItOut?",
    answer:
      "Verify identity, keep written agreement records, avoid cash-only deals without receipt, document handover condition, and keep all payment and chat proof until closure.",
  },
];

export const metadata: Metadata = buildPageMetadata({
  title: "Frequently Asked Questions",
  description: "Find common renter and owner questions about using RentItOut, listing flow, contact reveal, payments, and agreements.",
  path: "/faqs",
  keywords: ["RentItOut FAQ", "appliance rental questions", "renter owner help", "rental marketplace FAQ"],
});

export default function FaqsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="space-y-3 border-b border-zinc-200 pb-6">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">RentItOut Help</p>
        <h1 className="text-3xl font-semibold text-zinc-950 sm:text-4xl">Frequently Asked Questions</h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-700">
          Common questions from renters and owners about listing flow, contact reveal, payments, agreements, and
          handover expectations.
        </p>
      </header>

      <section className="mt-6 divide-y divide-zinc-300">
        {FAQ_ITEMS.map((faq) => (
          <details key={faq.question} className="group">
            <summary className="flex cursor-pointer list-none items-start gap-4 py-5 text-base font-medium leading-7 text-zinc-900 marker:content-none sm:text-lg">
              <span>{faq.question}</span>
              <span aria-hidden="true" className="ml-auto shrink-0 text-2xl leading-none text-zinc-900 group-open:hidden">
                +
              </span>
            </summary>
            <p className="pb-5 pr-10 text-sm leading-7 text-zinc-700 sm:text-base">{faq.answer}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
