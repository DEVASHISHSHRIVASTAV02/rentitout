export const CATEGORY_GRADIENT_CLASS = {
  All: "from-zinc-700 to-zinc-900",
  AC: "from-cyan-500 to-sky-600",
  Bed: "from-indigo-500 to-blue-700",
  Cooler: "from-teal-500 to-emerald-700",
  Fridge: "from-blue-500 to-cyan-700",
  Geyser: "from-orange-500 to-red-600",
  Mattress: "from-fuchsia-500 to-pink-600",
  "Washing Machine": "from-violet-500 to-indigo-700",
  "Water Purifier": "from-sky-500 to-blue-700",
} as const;

export function getCategoryGradientClass(category: string) {
  return CATEGORY_GRADIENT_CLASS[category as keyof typeof CATEGORY_GRADIENT_CLASS] ?? CATEGORY_GRADIENT_CLASS.All;
}
