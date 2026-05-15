import { SUPPORTED_CITIES } from "@/lib/cities";
import { LISTABLE_ITEMS, type ListableItem } from "@/lib/listable-items";

export interface SeoCityCategoryIntent {
  city: string;
  category: ListableItem;
  citySlug: string;
  categorySlug: string;
  path: string;
}

const HOMEPAGE_CITY_CATEGORY_INTENTS_RAW: ReadonlyArray<{
  city: string;
  category: ListableItem;
}> = [
  { city: "Delhi", category: "AC" },
  { city: "Delhi", category: "Washing Machine" },
  { city: "Mumbai", category: "Fridge" },
  { city: "Mumbai", category: "AC" },
  { city: "Bengaluru", category: "Washing Machine" },
  { city: "Bengaluru", category: "Fridge" },
  { city: "Pune", category: "Bed" },
  { city: "Pune", category: "Mattress" },
  { city: "Hyderabad", category: "Water Purifier" },
  { city: "Hyderabad", category: "AC" },
  { city: "Chennai", category: "Fridge" },
  { city: "Chennai", category: "Cooler" },
  { city: "Noida", category: "Geyser" },
  { city: "Noida", category: "Bed" },
  { city: "Gurugram", category: "AC" },
  { city: "Gurugram", category: "Water Purifier" },
];

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toIntent(entry: { city: string; category: ListableItem }): SeoCityCategoryIntent {
  const citySlug = toSlug(entry.city);
  const categorySlug = toSlug(entry.category);
  return {
    city: entry.city,
    category: entry.category,
    citySlug,
    categorySlug,
    path: `/rentals/${citySlug}/${categorySlug}`,
  };
}

const ALL_CITY_CATEGORY_INTENTS_RAW: Array<{ city: string; category: ListableItem }> = [];

for (const city of SUPPORTED_CITIES) {
  for (const category of LISTABLE_ITEMS) {
    ALL_CITY_CATEGORY_INTENTS_RAW.push({ city, category });
  }
}

export const SEO_CITY_CATEGORY_INTENTS = ALL_CITY_CATEGORY_INTENTS_RAW.map(toIntent);

export const HOMEPAGE_CITY_CATEGORY_INTENTS = HOMEPAGE_CITY_CATEGORY_INTENTS_RAW.map(toIntent);

const INTENT_BY_ROUTE_KEY = new Map<string, SeoCityCategoryIntent>(
  SEO_CITY_CATEGORY_INTENTS.map((intent) => [`${intent.citySlug}:${intent.categorySlug}`, intent]),
);

export function getSeoIntentBySlugs(citySlug: string, categorySlug: string) {
  return INTENT_BY_ROUTE_KEY.get(`${citySlug}:${categorySlug}`) ?? null;
}

export function getRelatedSeoIntents(intent: SeoCityCategoryIntent, limit = 10) {
  const sameCity = SEO_CITY_CATEGORY_INTENTS.filter(
    (entry) => entry.citySlug === intent.citySlug && entry.categorySlug !== intent.categorySlug,
  );
  const sameCategory = SEO_CITY_CATEGORY_INTENTS.filter(
    (entry) => entry.categorySlug === intent.categorySlug && entry.citySlug !== intent.citySlug,
  );

  return [...sameCity, ...sameCategory].slice(0, Math.max(0, limit));
}
