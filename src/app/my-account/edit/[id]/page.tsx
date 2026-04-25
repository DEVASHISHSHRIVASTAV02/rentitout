import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureProfile, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { CreateListingForm } from "@/components/create-listing-form";
import { Alert } from "@/components/ui/alert";
import { type ListableItem, LISTABLE_ITEMS } from "@/lib/listable-items";
import { CATEGORY_ITEM_INFO_PRESET_OPTIONS, CATEGORY_SUBCATEGORY_OPTIONS } from "@/lib/listing-form-config";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function isListableItem(value: string): value is ListableItem {
  return LISTABLE_ITEMS.includes(value as ListableItem);
}

export default async function EditListingPage({ params, searchParams }: EditListingPageProps) {
  const { id } = await params;
  const queryParams = await searchParams;
  const message = typeof queryParams.message === "string" ? queryParams.message : "";
  const error = typeof queryParams.error === "string" ? queryParams.error : "";

  const user = await requireUser();
  await ensureProfile(user);

  const { rows } = await query<{
    id: string;
    category: string;
    sub_category: string | null;
    item_info: string | null;
    price_per_month: number;
    min_agreement_months: number;
    city: string;
    pincode: string;
    contact_email: string;
    phone: string | null;
  }>(
    `
      select
        id,
        category,
        sub_category,
        item_info,
        price_per_month,
        min_agreement_months,
        city,
        pincode,
        contact_email,
        phone
      from listing
      where id = $1
        and owner_id = $2
      limit 1
    `,
    [id, user.id],
  );

  const listing = rows[0];
  if (!listing || !isListableItem(listing.category)) {
    notFound();
  }

  const fallbackSubCategory = CATEGORY_SUBCATEGORY_OPTIONS[listing.category][0] ?? "General";
  const fallbackItemInfo = (CATEGORY_ITEM_INFO_PRESET_OPTIONS[listing.category] ?? [])[0] ?? "";

  return (
    <div className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">My Account</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950 sm:text-3xl">Edit Listing</h1>
        </div>
        <Link href="/my-account" className="text-sm text-zinc-700 hover:text-zinc-950">
          Back to My Account
        </Link>
      </div>

      {message ? <Alert message={message} type="success" /> : null}
      {error ? <Alert message={error} type="error" /> : null}

      <CreateListingForm
        defaultContactEmail={user.email ?? ""}
        redirectTo="/my-account"
        initialValues={{
          id: listing.id,
          category: listing.category,
          subCategory: listing.sub_category ?? fallbackSubCategory,
          itemInfo: listing.item_info ?? fallbackItemInfo,
          pricePerMonth: listing.price_per_month,
          minAgreementMonths: listing.min_agreement_months,
          city: listing.city,
          pincode: listing.pincode,
          contactEmail: listing.contact_email ?? user.email ?? "",
          contactPhone: listing.phone,
        }}
      />
    </div>
  );
}
