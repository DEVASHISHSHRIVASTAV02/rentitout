import Image from "next/image";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import { SUPPORTED_CITIES } from "@/lib/cities";
import { cn } from "@/lib/utils";

const CITY_MONUMENTS: Record<(typeof SUPPORTED_CITIES)[number], { monument: string; image: string }> = {
  Delhi: { monument: "Red Fort", image: "/city-monuments/real_delhi_new.jpeg" },
  Mumbai: { monument: "Gateway of India", image: "/city-monuments/real_mumbai.jpg" },
  Pune: { monument: "Shaniwar Wada", image: "/city-monuments/real_pune_new.jpg" },
  Kolkata: { monument: "Howrah Bridge", image: "/city-monuments/real_kolkata.jpg" },
  Chennai: { monument: "Kapaleeshwarar Temple", image: "/city-monuments/real_chennai_new.jpg" },
  Hyderabad: { monument: "Charminar", image: "/city-monuments/real_hydrabad.webp" },
  Gurugram: { monument: "DLF Cyber Hub", image: "/city-monuments/real_gurgoan.jpg" },
  Bengaluru: { monument: "Vidhana Soudha", image: "/city-monuments/real_banglore.jpg" },
  Ahmedabad: { monument: "Sabarmati Riverfront", image: "/city-monuments/real_ahemdabad_new.webp" },
  Noida: { monument: "Supernova", image: "/city-monuments/real_noida_new.jpg" },
  "Greater Noida": { monument: "Buddh International Circuit", image: "/city-monuments/real_greaternoida_new.jpg" },
  Faridabad: { monument: "Raja Nahar Singh Palace", image: "/city-monuments/real_faridabad_new.jpg" },
  Ghaziabad: { monument: "Lakshmi Narayan Temple", image: "/city-monuments/real_ghaziabad.avif" },
};

interface CityQuickButtonsProps {
  className?: string;
}

const CITY_CARD_IMAGE_SIZES =
  "(max-width: 639px) calc((100vw - 2.75rem) / 2), (max-width: 767px) calc((100vw - 4.5rem) / 3), (max-width: 1023px) calc((100vw - 4.5rem) / 3), (max-width: 1279px) calc((100vw - 5.25rem) / 4), 220px";

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
              "group h-full rounded-2xl bg-black p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-zinc-900 hover:shadow-md",
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
                  sizes={CITY_CARD_IMAGE_SIZES}
                  quality={60}
                  className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-28 md:h-32"
                />
              </div>
              <div className="mt-auto px-1 pb-1 text-center">
                <p className="text-sm font-semibold text-white sm:text-base">{city}</p>
              </div>
            </div>
          </IntentPrefetchLink>
        );
      })}
    </div>
  );
}
