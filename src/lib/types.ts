import { type ListableItem } from "@/lib/listable-items";

export type ListingCategory = ListableItem;
export type PublicListingSortOrder =
  | "price_low_to_high"
  | "price_high_to_low"
  | "date_latest"
  | "date_oldest";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  city: string | null;
  phone: string | null;
  show_email_on_listing?: boolean;
  show_phone_on_listing?: boolean;
  created_at: string;
}

interface ApplianceListingBase {
  id: string;
  listing_id: string;
  owner_id: string;
  category: ListingCategory;
  sub_category: string | null;
  item_info: string | null;
  price_per_month: number;
  min_agreement_months: number;
  image_urls: string[];
  city: string;
  pincode: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApplianceListing extends ApplianceListingBase {
  contact_email: string;
  phone: string | null;
}

export type PublicApplianceListing = ApplianceListingBase;
