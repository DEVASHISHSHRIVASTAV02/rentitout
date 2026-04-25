import { LISTABLE_ITEMS, type ListableItem } from "@/lib/listable-items";
import { CATEGORY_ITEM_INFO_DISPLAY_LABEL, CATEGORY_SUBCATEGORY_LABEL } from "@/lib/listing-form-config";

interface ListingDetailFieldInput {
  category: string;
  subCategory: string | null;
  itemInfo: string | null;
}

export interface ListingDetailField {
  label: string;
  value: string;
}

function isListableItem(value: string): value is ListableItem {
  return LISTABLE_ITEMS.includes(value as ListableItem);
}

function normalizeText(value: string | null) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getListingDetailFields({ category, subCategory, itemInfo }: ListingDetailFieldInput): ListingDetailField[] {
  const fields: ListingDetailField[] = [];
  const normalizedSubCategory = normalizeText(subCategory);
  const normalizedItemInfo = normalizeText(itemInfo);
  const subCategoryLabel = isListableItem(category) ? CATEGORY_SUBCATEGORY_LABEL[category] : "Subcategory";
  const itemInfoLabel = isListableItem(category) ? CATEGORY_ITEM_INFO_DISPLAY_LABEL[category] : "Info";

  if (normalizedSubCategory) {
    fields.push({
      label: subCategoryLabel,
      value: normalizedSubCategory,
    });
  }

  if (normalizedItemInfo) {
    fields.push({
      label: itemInfoLabel,
      value: normalizedItemInfo,
    });
  }

  return fields;
}
