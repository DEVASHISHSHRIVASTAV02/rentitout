import type { LucideIcon } from "lucide-react";
import { AirVent, BedDouble, Droplets, Flame, Snowflake, Sparkles, WashingMachine, Wind } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ApplianceQuickLink {
  label: string;
  category: string;
  icon: LucideIcon;
  gradientClass: string;
}

const applianceQuickLinks: ApplianceQuickLink[] = [
  {
    label: "All",
    category: "All",
    icon: Sparkles,
    gradientClass: "from-zinc-700 to-zinc-900",
  },
  {
    label: "AC",
    category: "AC",
    icon: AirVent,
    gradientClass: "from-cyan-500 to-sky-600",
  },
  {
    label: "Bed",
    category: "Bed",
    icon: BedDouble,
    gradientClass: "from-indigo-500 to-blue-700",
  },
  {
    label: "Cooler",
    category: "Cooler",
    icon: Wind,
    gradientClass: "from-teal-500 to-emerald-700",
  },
  {
    label: "Fridge",
    category: "Fridge",
    icon: Snowflake,
    gradientClass: "from-blue-500 to-cyan-700",
  },
  {
    label: "Geyser",
    category: "Geyser",
    icon: Flame,
    gradientClass: "from-orange-500 to-red-600",
  },
  {
    label: "Mattress",
    category: "Mattress",
    icon: BedDouble,
    gradientClass: "from-fuchsia-500 to-pink-600",
  },
  {
    label: "Washing Machine",
    category: "Washing Machine",
    icon: WashingMachine,
    gradientClass: "from-violet-500 to-indigo-700",
  },
  {
    label: "Water Purifier",
    category: "Water Purifier",
    icon: Droplets,
    gradientClass: "from-sky-500 to-blue-700",
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
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-nowrap lg:items-center lg:overflow-x-auto lg:pb-1", className)}>
      {applianceQuickLinks.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={getBrowseHref(item.category)}
            className={cn(
              "group relative inline-flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/25 bg-gradient-to-br px-3 py-2 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg lg:w-auto lg:shrink-0 lg:justify-start",
              item.gradientClass,
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_55%)]" />

            <div className="relative flex items-center gap-2">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/15">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-center text-xs font-semibold leading-tight sm:text-sm sm:whitespace-nowrap">
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
