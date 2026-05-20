import Image from "next/image";
import { Check, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

const comparisonRows = [
  {
    label: "Better prices from direct owner competition",
    others: false,
    RentItOut: true,
  },
  {
    label: "No hidden platform fees",
    others: false,
    RentItOut: true,
  },
  {
    label: "Browse listings without login",
    others: false,
    RentItOut: true,
  },
  {
    label: "No subscription fee charged",
    others: false,
    RentItOut: true,
  },
  {
    label: "Rent agreement freedom between renter and owner",
    others: false,
    RentItOut: true,
  },
] as const;

const rotatingImages = [
  {
    src: "/comparison-images/WASHINGMACHINENEW.webp",
    alt: "Modern washing machine in a clean interior",
  },
  {
    src: "/comparison-images/FRIDGENEW.webp",
    alt: "Elegant refrigerator in a modern kitchen",
  },
  {
    src: "/comparison-images/ACNEW.webp",
    alt: "Air conditioner in a bright home interior",
  },
  {
    src: "/comparison-images/BEDNEW.webp",
    alt: "Simple bedroom with a comfortable bed",
  },
  {
    src: "/comparison-images/WATERPURIFIERNEW.webp",
    alt: "Water purifier setup in a kitchen space",
  },
] as const;

interface StatusMarkProps {
  enabled: boolean;
}

function StatusMark({ enabled }: StatusMarkProps) {
  const statusText = enabled ? "Available" : "Not available";

  return (
    <>
      <span
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full border",
          enabled ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-rose-300 bg-rose-50 text-rose-600",
        )}
        aria-hidden="true"
      >
        {enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </span>
      <span className="sr-only">{statusText}</span>
    </>
  );
}

export function MarketplaceComparisonCard() {
  return (
    <section className="pt-6" aria-label="RentItOut comparison">
      <div className="inline-flex items-center gap-2 rounded-full border border-zinc-900/10 bg-zinc-100 px-3 py-1 text-[10px] tracking-[0.14em] text-zinc-700 sm:px-4 sm:text-[11px] sm:tracking-[0.2em]">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>OWNER-FIRST VALUE</span>
      </div>

      <h2 className="mt-4 text-2xl font-semibold leading-tight text-zinc-950 sm:text-3xl">
        Here&apos;s Why <span className="text-blue-700">RentItOut Is the Better Choice</span>
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-zinc-700 sm:text-base">
        Transparent pricing, open access, and full agreement flexibility for renters and owners.
      </p>

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[1.35fr_0.95fr] lg:items-stretch">
        <div className="min-w-0 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-200/80 via-indigo-100/70 to-white p-4 sm:p-5">
          <div className="space-y-3 sm:hidden">
            {comparisonRows.map((row) => (
              <div key={row.label} className="rounded-xl border border-blue-200/80 bg-white/75 p-3">
                <p className="text-sm font-semibold text-zinc-900">{row.label}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Others</p>
                    <div className="mt-2 inline-flex">
                      <StatusMark enabled={row.others} />
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">RentItOut</p>
                    <div className="mt-2 inline-flex">
                      <StatusMark enabled={row.RentItOut} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  <th className="w-[60%] px-2 py-2 text-sm font-semibold text-zinc-700 sm:px-3">Feature</th>
                  <th className="w-[18%] px-2 py-2 text-center text-sm font-semibold text-zinc-700 sm:px-3">Others</th>
                  <th className="w-[22%] rounded-t-xl border-x border-t border-blue-200 bg-blue-50 px-2 py-2 text-center text-sm font-semibold text-blue-900 sm:px-3">
                    RentItOut
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => {
                  const isLast = index === comparisonRows.length - 1;
                  return (
                    <tr key={row.label}>
                      <td
                        className={cn(
                          "border-b border-zinc-300/70 px-2 py-3 text-sm font-medium text-zinc-900 sm:px-3",
                          isLast && "border-b-0",
                        )}
                      >
                        {row.label}
                      </td>
                      <td
                        className={cn(
                          "border-b border-zinc-300/70 px-2 py-3 text-center sm:px-3",
                          isLast && "border-b-0",
                        )}
                      >
                        <StatusMark enabled={row.others} />
                      </td>
                      <td
                        className={cn(
                          "border-x border-blue-200 bg-blue-50/70 px-2 py-3 text-center sm:px-3",
                          isLast ? "rounded-b-xl border-b" : "border-b",
                        )}
                      >
                        <StatusMark enabled={row.RentItOut} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
          <div className="relative h-full min-h-[260px] sm:min-h-[360px] lg:min-h-[420px]">
            <Image
              src={rotatingImages[0].src}
              alt={rotatingImages[0].alt}
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 36vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
