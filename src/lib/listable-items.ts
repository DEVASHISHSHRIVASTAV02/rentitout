export const LISTABLE_ITEMS = [
  "AC",
  "Bed",
  "Cooler",
  "Fridge",
  "Geyser",
  "Mattress",
  "Washing Machine",
  "Water Purifier",
] as const;

export const LISTABLE_ITEMS_WITH_ALL = ["All", ...LISTABLE_ITEMS] as const;

export type ListableItem = (typeof LISTABLE_ITEMS)[number];

