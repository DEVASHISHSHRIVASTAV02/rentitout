"use client";

import { Select } from "@/components/ui/select";

type SortOrder = "price_low_to_high" | "price_high_to_low";

interface SortSelectFormProps {
  city: string;
  category: string;
  subCategory: string;
  itemInfo: string;
  listingId: string;
  pincode: string;
  minPrice: string;
  maxPrice: string;
  agreementMin: string;
  sortOrder: SortOrder;
}

export function SortSelectForm({
  city,
  category,
  subCategory,
  itemInfo,
  listingId,
  pincode,
  minPrice,
  maxPrice,
  agreementMin,
  sortOrder,
}: SortSelectFormProps) {
  return (
    <form className="flex w-full justify-end">
      <input type="hidden" name="city" value={city || "All Cities"} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="subCategory" value={subCategory} />
      <input type="hidden" name="itemInfo" value={itemInfo} />
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="pincode" value={pincode} />
      <input type="hidden" name="minPrice" value={minPrice} />
      <input type="hidden" name="maxPrice" value={maxPrice} />
      <input type="hidden" name="agreementMin" value={agreementMin} />

      <label className="w-full sm:max-w-[220px]">
        <span className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Sort By</span>
        <Select
          name="sort"
          defaultValue={sortOrder}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
        >
          <option value="price_low_to_high">Price: Low to High</option>
          <option value="price_high_to_low">Price: High to Low</option>
        </Select>
      </label>
    </form>
  );
}
