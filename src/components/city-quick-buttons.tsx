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
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", className)}>
      {SUPPORTED_CITIES.map((city, index) => {
        const card = CITY_MONUMENTS[city];
        const tiltClass = index % 2 === 0 ? "sm:rotate-[0.2deg]" : "sm:-rotate-[0.2deg]";

        return (
          <Link
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
                  className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-28 md:h-32"
                />
              </div>
              <div className="mt-auto px-1 pb-1 text-center">
                <p className="text-sm font-semibold text-white sm:text-base">{city}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
