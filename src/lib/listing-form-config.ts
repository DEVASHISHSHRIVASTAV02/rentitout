import { type ListableItem } from "@/lib/listable-items";

export const CATEGORY_SUBCATEGORY_OPTIONS: Record<ListableItem, string[]> = {
  AC: ["Window", "Split"],
  Bed: ["Standard", "Storage", "Hydraulic"],
  Cooler: ["Desert", "Tower", "Personal", "Window"],
  Fridge: ["Single Door", "Double Door", "Side by Side"],
  Geyser: ["Instant", "Storage"],
  Mattress: ["Foam", "Spring", "Orthopedic", "Latex", "Hybrid"],
  "Washing Machine": ["Front Load", "Top Load"],
  "Water Purifier": ["RO", "UV", "RO + UV"],
};

export const CATEGORY_SUBCATEGORY_LABEL: Record<ListableItem, string> = {
  AC: "Type",
  Bed: "Type",
  Cooler: "Type",
  Fridge: "Type",
  Geyser: "Type",
  Mattress: "Material",
  "Washing Machine": "Type",
  "Water Purifier": "Type",
};

export const CATEGORY_ITEM_INFO_LABEL: Record<ListableItem, string> = {
  AC: "Tonnage (e.g. 1.5 Ton)",
  Bed: "Bed size",
  Cooler: "Capacity (liters)",
  Fridge: "Capacity (liters)",
  Geyser: "Capacity (liters)",
  Mattress: "Thickness (inches)",
  "Washing Machine": "Capacity (kg)",
  "Water Purifier": "Capacity (LPH)",
};

export const CATEGORY_ITEM_INFO_DISPLAY_LABEL: Record<ListableItem, string> = {
  AC: "Tonnage",
  Bed: "Bed size",
  Cooler: "Capacity (liters)",
  Fridge: "Capacity (liters)",
  Geyser: "Capacity (liters)",
  Mattress: "Thickness",
  "Washing Machine": "Capacity (kg)",
  "Water Purifier": "Capacity (LPH)",
};

export const CATEGORY_ITEM_INFO_PRESET_OPTIONS: Partial<Record<ListableItem, string[]>> = {
  AC: ["1 Ton", "1.5 Ton", "2 Ton"],
  Bed: ["6 x 6", "6 x 3", "Queen", "King", "Single"],
  Cooler: Array.from({ length: 10 }, (_, index) => `${(index + 1) * 10} liters`),
  Geyser: Array.from({ length: 25 }, (_, index) => `${index + 1} ${index === 0 ? "liter" : "liters"}`),
  Mattress: Array.from({ length: 13 }, (_, index) => `${index + 4} inches`),
  Fridge: Array.from({ length: 12 }, (_, index) => `${150 + index * 50}L`),
  "Washing Machine": Array.from({ length: 6 }, (_, index) => `${5 + index} kg`),
  "Water Purifier": Array.from({ length: 21 }, (_, index) => `${5 + index} LPH`),
};

export const CATEGORY_DONE_BUTTON_CLASS: Record<ListableItem, string> = {
  AC: "bg-sky-600 text-white hover:bg-sky-700",
  Bed: "bg-indigo-600 text-white hover:bg-indigo-700",
  Cooler: "bg-emerald-600 text-white hover:bg-emerald-700",
  Fridge: "bg-cyan-600 text-white hover:bg-cyan-700",
  Geyser: "bg-red-600 text-white hover:bg-red-700",
  Mattress: "bg-pink-600 text-white hover:bg-pink-700",
  "Washing Machine": "bg-violet-600 text-white hover:bg-violet-700",
  "Water Purifier": "bg-blue-600 text-white hover:bg-blue-700",
};
