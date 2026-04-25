import Image from "next/image";
import Link from "next/link";
import { SUPPORTED_CITIES } from "@/lib/cities";
import { cn } from "@/lib/utils";

const CITY_MONUMENTS: Record<(typeof SUPPORTED_CITIES)[number], { monument: string; image: string }> = {
  Delhi: { monument: "Red Fort", image: "/city-monuments/Delhiredfort.png" },
  Mumbai: { monument: "Gateway of India", image: "/city-monuments/MumbaigatewayofIndia.png" },
  Pune: { monument: "Shaniwar Wada", image: "/city-monuments/PuneShaniwarWada.png" },
  Kolkata: { monument: "Howrah Bridge", image: "/city-monuments/KolkataHowarhbridge.png" },
  Chennai: { monument: "Kapaleeshwarar Temple", image: "/city-monuments/ChennaiKapaleeshwararTemple.png" },
  Hyderabad: { monument: "Charminar", image: "/city-monuments/Hydrabadcharminar.png" },
  Gurugram: { monument: "DLF Cyber Hub", image: "/city-monuments/GurgaonDLFcyberhub.png" },
  Bengaluru: { monument: "Vidhana Soudha", image: "/city-monuments/BangloreVidhanSoudhan.png" },
  Ahmedabad: { monument: "Sabarmati Riverfront", image: "/city-monuments/Ahemdabadsabarmatiriverfront.png" },
  Noida: { monument: "Supernova", image: "/city-monuments/NoidaSupernova.png" },
  "Greater Noida": { monument: "Buddh International Circuit", image: "/city-monuments/GreaternoidaF1track.png" },
  Faridabad: { monument: "Raja Nahar Singh Palace", image: "/city-monuments/FaridabadRajaNaharSinghPalace.png" },
  Ghaziabad: { monument: "Lakshmi Narayan Temple", image: "/city-monuments/Ghaziabadlakshminarayantemple.png" },
};

interface CityQuickButtonsProps {
  className?: string;
}

function getBrowseCityHref(city: string) {
  return `/browse?city=${encodeURIComponent(city)}&category=All`;
}

export function CityQuickButtons({ className }: CityQuickButtonsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", className)}>
      {SUPPORTED_CITIES.map((city, index) => {
        const card = CITY_MONUMENTS[city];
        const tiltClass = index % 2 === 0 ? "sm:rotate-[0.2deg]" : "sm:-rotate-[0.2deg]";

        return (
          <Link
            key={city}
            href={getBrowseCityHref(city)}
            className={cn(
              "group rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
              tiltClass,
            )}
          >
            <div className="space-y-2">
              <div className="overflow-hidden rounded-xl border border-zinc-200">
                <Image
                  src={card.image}
                  alt={`${card.monument} in ${city}`}
                  width={800}
                  height={520}
                  className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="px-1 pb-1">
                <p className="text-sm font-semibold text-zinc-900 sm:text-base">{city}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
