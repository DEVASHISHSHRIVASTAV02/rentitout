import Image from "next/image";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import { SUPPORTED_CITIES } from "@/lib/cities";
import { cn } from "@/lib/utils";

const CITY_MONUMENTS: Record<(typeof SUPPORTED_CITIES)[number], { monument: string; image: string }> = {
  Delhi: { monument: "Red Fort", image: "/city-monuments/delhi.webp" },
  Mumbai: { monument: "Gateway of India", image: "/city-monuments/mumbai.webp" },
  Pune: { monument: "Shaniwar Wada", image: "/city-monuments/pune.webp" },
  Kolkata: { monument: "Howrah Bridge", image: "/city-monuments/kolkata.webp" },
  Chennai: { monument: "Kapaleeshwarar Temple", image: "/city-monuments/chennai.webp" },
  Hyderabad: { monument: "Charminar", image: "/city-monuments/hydrabad.webp" },
  Gurugram: { monument: "DLF Cyber Hub", image: "/city-monuments/gurgoan.webp" },
  Bengaluru: { monument: "Vidhana Soudha", image: "/city-monuments/banglore.webp" },
  Ahmedabad: { monument: "Sabarmati Riverfront", image: "/city-monuments/ahemdabad.webp" },
  Noida: { monument: "Supernova", image: "/city-monuments/noida.webp" },
  "Greater Noida": { monument: "Buddh International Circuit", image: "/city-monuments/greaternoida.webp" },
  Faridabad: { monument: "Raja Nahar Singh Palace", image: "/city-monuments/faridabad.webp" },
  Ghaziabad: { monument: "Lakshmi Narayan Temple", image: "/city-monuments/ghaziabad.webp" },
};

interface CityQuickButtonsProps {
  className?: string;
}

function getBrowseCityHref(city: string) {
  return `/browse?city=${encodeURIComponent(city)}&category=All`;
}

export function CityQuickButtons({ className }: CityQuickButtonsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", className)}>
      {SUPPORTED_CITIES.map((city, index) => {
        const card = CITY_MONUMENTS[city];
        const tiltClass = index % 2 === 0 ? "sm:rotate-[0.2deg]" : "sm:-rotate-[0.2deg]";

        return (
          <IntentPrefetchLink
            key={city}
            href={getBrowseCityHref(city)}
            className={cn(
              "group h-full rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900",
              tiltClass,
            )}
          >
            <div className="flex h-full flex-col gap-2">
              <div className="overflow-hidden rounded-xl">
                <Image
                  src={card.image}
                  alt={`${card.monument} in ${city}`}
                  width={800}
                  height={520}
                  loading="lazy"
                  quality={50}
                  sizes="(max-width: 640px) 43vw, (max-width: 1024px) 31vw, (max-width: 1280px) 23vw, 18vw"
                  className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-28 md:h-32"
                />
              </div>
              <div className="mt-auto px-1 pb-1 text-center">
                <p className="text-sm font-semibold text-zinc-950 sm:text-base">{city}</p>
              </div>
            </div>
          </IntentPrefetchLink>
        );
      })}
    </div>
  );
}
