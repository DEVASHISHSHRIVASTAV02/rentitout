import type { LucideIcon } from "lucide-react";
import { AirVent, BedDouble, Droplets, Flame, Snowflake, Sparkles, WashingMachine, Wind } from "lucide-react";
import Link from "next/link";
import { getCategoryGradientClass } from "@/lib/category-gradient";
import { cn } from "@/lib/utils";

interface ApplianceQuickLink {
  label: string;
  category: string;
  icon: LucideIcon;
}

const applianceQuickLinks: ApplianceQuickLink[] = [
  {
    label: "All",
    category: "All",
    icon: Sparkles,
  },
  {
    label: "AC",
    category: "AC",
    icon: AirVent,
  },
  {
    label: "Bed",
    category: "Bed",
    icon: BedDouble,
  },
  {
    label: "Cooler",
    category: "Cooler",
    icon: Wind,
  },
  {
    label: "Fridge",
    category: "Fridge",
    icon: Snowflake,
  },
  {
    label: "Geyser",
    category: "Geyser",
    icon: Flame,
  },
  {
    label: "Mattress",
    category: "Mattress",
    icon: BedDouble,
  },
  {
    label: "Washing Machine",
    category: "Washing Machine",
    icon: WashingMachine,
  },
  {
    label: "Water Purifier",
    category: "Water Purifier",
    icon: Droplets,
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
        "flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory sm:flex-wrap sm:overflow-visible sm:pb-0 sm:snap-none",
        className,
      )}
    >
      {applianceQuickLinks.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={getBrowseHref(item.category)}
            className={cn(
              "group relative inline-flex min-h-12 w-auto min-w-max shrink-0 snap-start items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/25 bg-gradient-to-br px-3 py-2 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg sm:snap-none",
              getCategoryGradientClass(item.category),
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_55%)]" />

            <div className="relative flex items-center gap-2">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/15">
                <Icon className="h-4 w-4" />
              </span>
              <span className="whitespace-nowrap text-center text-xs font-semibold leading-tight sm:text-left sm:text-sm">
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
