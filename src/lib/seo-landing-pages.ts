import { type ListableItem } from "@/lib/listable-items";

export interface SeoCityCategoryIntent {
  city: string;
  category: ListableItem;
  citySlug: string;
  categorySlug: string;
  path: string;
}

const TOP_CITY_CATEGORY_INTENTS: ReadonlyArray<{
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

export const SEO_CITY_CATEGORY_INTENTS = TOP_CITY_CATEGORY_INTENTS.map(toIntent);

const INTENT_BY_ROUTE_KEY = new Map<string, SeoCityCategoryIntent>(
  SEO_CITY_CATEGORY_INTENTS.map((intent) => [`${intent.citySlug}:${intent.categorySlug}`, intent]),
);

export function getSeoIntentBySlugs(citySlug: string, categorySlug: string) {
  return INTENT_BY_ROUTE_KEY.get(`${citySlug}:${categorySlug}`) ?? null;
}
