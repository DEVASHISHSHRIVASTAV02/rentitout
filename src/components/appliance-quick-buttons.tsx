import Image from "next/image";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import { cn } from "@/lib/utils";

interface ApplianceQuickLink {
  label: string;
  category: string;
  imageSrc?: string;
}

const applianceQuickLinks: ApplianceQuickLink[] = [
  {
    label: "AC",
    category: "AC",
    imageSrc: "/category-images/AC.webp",
  },
  {
    label: "Bed",
    category: "Bed",
    imageSrc: "/category-images/BED.webp",
  },
  {
    label: "Cooler",
    category: "Cooler",
    imageSrc: "/category-images/COOLER.webp",
  },
  {
    label: "Fridge",
    category: "Fridge",
    imageSrc: "/category-images/FRIDGE.webp",
  },
  {
    label: "Geyser",
    category: "Geyser",
    imageSrc: "/category-images/GEYSER.webp",
  },
  {
    label: "Mattress",
    category: "Mattress",
    imageSrc: "/category-images/MATTRESS.webp",
  },
  {
    label: "Washing Machine",
    category: "Washing Machine",
    imageSrc: "/category-images/WASHINGMACHINE.webp",
  },
  {
    label: "Water Purifier",
    category: "Water Purifier",
    imageSrc: "/category-images/WATERPURIFIER.webp",
  },
];

function getBrowseHref(category: string) {
  return category === "All" ? "/browse" : `/browse?category=${encodeURIComponent(category)}`;
}

interface ApplianceQuickButtonsProps {
  className?: string;
}

export function ApplianceQuickButtons({ className }: ApplianceQuickButtonsProps) {
  return (
    <div
      className={cn(
        "mb-5 flex gap-4 overflow-x-scroll pb-1 snap-x snap-mandatory",
        className,
      )}
    >
      {applianceQuickLinks.map((item) => {
        const isFirstCard = item.category === applianceQuickLinks[0]?.category;

        return (
          <IntentPrefetchLink
            key={item.label}
            href={getBrowseHref(item.category)}
            className="group inline-flex min-w-[11rem] shrink-0 snap-start flex-col sm:min-w-[13rem] sm:snap-none"
          >
            {item.imageSrc ? (
              <div className="relative h-28 w-full overflow-hidden rounded-2xl shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg sm:h-32">
                <Image
                  src={item.imageSrc}
                  alt={`${item.label} rental category`}
                  width={208}
                  height={128}
                  loading={isFirstCard ? "eager" : "lazy"}
                  fetchPriority={isFirstCard ? "high" : "auto"}
                  sizes="(max-width: 640px) 44vw, 208px"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="flex h-28 w-full items-center justify-center rounded-2xl bg-zinc-100 shadow-sm sm:h-32">
                <span className="text-sm font-semibold text-zinc-600">{item.label}</span>
              </div>
            )}
            <span className="mt-2 px-1 text-center text-xs font-semibold leading-tight text-zinc-900 sm:text-sm">
              {item.label}
            </span>
          </IntentPrefetchLink>
        );
      })}
    </div>
  );
}
