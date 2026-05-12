"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { PincodeInputWithHighlights } from "@/components/pincode-input-with-highlights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SUPPORTED_CITIES } from "@/lib/cities";
import { type ListableItem, LISTABLE_ITEMS, LISTABLE_ITEMS_WITH_ALL } from "@/lib/listable-items";
import {
  CATEGORY_ITEM_INFO_LABEL,
  CATEGORY_ITEM_INFO_PRESET_OPTIONS,
  CATEGORY_SUBCATEGORY_LABEL,
  CATEGORY_SUBCATEGORY_OPTIONS,
} from "@/lib/listing-form-config";

const AGREEMENT_MONTH_OPTIONS = Array.from({ length: 24 }, (_, index) => index + 1);

interface BrowseFiltersFormProps {
  sortOrder: "price_low_to_high" | "price_high_to_low";
  category: string;
  subCategory: string;
  itemInfo: string;
  city: string;
  listingId: string;
  pincode: string;
  minPrice: string;
  maxPrice: string;
  agreementMin: string;
  showHeader?: boolean;
}

function isListableItem(value: string): value is ListableItem {
  return LISTABLE_ITEMS.includes(value as ListableItem);
}

export function BrowseFiltersForm({
  sortOrder,
  category,
  subCategory,
  itemInfo,
  city,
  listingId,
  pincode,
  minPrice,
  maxPrice,
  agreementMin,
  showHeader = true,
}: BrowseFiltersFormProps) {
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedSubCategory, setSelectedSubCategory] = useState(subCategory);
  const [selectedItemInfo, setSelectedItemInfo] = useState(itemInfo);

  const normalizedCategory = useMemo(
    () => (isListableItem(selectedCategory) ? selectedCategory : null),
    [selectedCategory],
  );
  const subCategoryOptions = normalizedCategory ? CATEGORY_SUBCATEGORY_OPTIONS[normalizedCategory] : [];
  const itemInfoPresetOptions = normalizedCategory ? CATEGORY_ITEM_INFO_PRESET_OPTIONS[normalizedCategory] ?? [] : [];
  const subCategoryLabel = normalizedCategory ? CATEGORY_SUBCATEGORY_LABEL[normalizedCategory] : "Subcategory";
  const allSubCategoryLabel = normalizedCategory
    ? `All ${subCategoryLabel.toLowerCase()}${subCategoryLabel.toLowerCase().endsWith("s") ? "" : "s"}`
    : "Select category first";
  const itemInfoLabel = normalizedCategory ? CATEGORY_ITEM_INFO_LABEL[normalizedCategory] : "Item Info";

  const handleCategoryChange = (nextCategory: string) => {
    setSelectedCategory(nextCategory);
    setSelectedSubCategory("");
    setSelectedItemInfo("");
  };

  return (
    <form className="space-y-4">
      <input type="hidden" name="sort" value={sortOrder} />
      <input type="hidden" name="page" value="1" />
      {showHeader ? (
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
            <span className="text-zinc-400">&amp;</span>
            <Search className="h-4 w-4" />
            <span>Search</span>
          </p>
        </div>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">Category</span>
        <Select name="category" value={selectedCategory} onChange={(event) => handleCategoryChange(event.target.value)}>
          {LISTABLE_ITEMS_WITH_ALL.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </Select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">{subCategoryLabel}</span>
        <Select
          key={`subcategory-${selectedCategory}`}
          name="subCategory"
          value={selectedSubCategory}
          onChange={(event) => setSelectedSubCategory(event.target.value)}
          disabled={!normalizedCategory}
        >
          <option value="">{allSubCategoryLabel}</option>
          {subCategoryOptions.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </Select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">{itemInfoLabel}</span>
        {itemInfoPresetOptions.length > 0 ? (
          <Select
            key={`item-info-${selectedCategory}`}
            name="itemInfo"
            value={selectedItemInfo}
            onChange={(event) => setSelectedItemInfo(event.target.value)}
            disabled={!normalizedCategory}
          >
            <option value="">{normalizedCategory ? "All" : "Select category first"}</option>
            {itemInfoPresetOptions.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            name="itemInfo"
            value={selectedItemInfo}
            onChange={(event) => setSelectedItemInfo(event.target.value)}
            placeholder={normalizedCategory ? `Filter by ${itemInfoLabel.toLowerCase()}` : "Select category first"}
            disabled={!normalizedCategory}
          />
        )}
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">City</span>
        <Select name="city" defaultValue={city || "All Cities"}>
          <option value="All Cities">All Cities</option>
          {SUPPORTED_CITIES.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </Select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">Listing ID</span>
        <Input name="listingId" defaultValue={listingId} placeholder="Example: WM-143205-03821" />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">Pincodes (up to 5)</span>
        <PincodeInputWithHighlights defaultValue={pincode} />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">Price (INR / month)</span>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <Input
            name="minPrice"
            type="number"
            min={0}
            step={1}
            defaultValue={minPrice}
            placeholder="Min monthly"
          />
          <span className="hidden px-1 text-center text-sm font-medium text-zinc-500 sm:block">to</span>
          <Input
            name="maxPrice"
            type="number"
            min={0}
            step={1}
            defaultValue={maxPrice}
            placeholder="Max monthly"
          />
        </div>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">Agreement Time Minimum</span>
        <Select name="agreementMin" defaultValue={agreementMin}>
          {AGREEMENT_MONTH_OPTIONS.map((months) => (
            <option key={months} value={months}>
              {months} {months === 1 ? "month" : "months"}
            </option>
          ))}
        </Select>
      </label>

      <Button type="submit" className="h-[42px] w-full">
        Apply
      </Button>
    </form>
  );
}
