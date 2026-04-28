import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { GetOwnerDetailsCard } from "@/components/get-owner-details-card";
import { ListingImageCarousel } from "@/components/listing-image-carousel";
import { getCurrentUser } from "@/lib/auth";
import { getListingById } from "@/lib/data";
import { getListingDetailFields } from "@/lib/listing-details";

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ListingDetailPage({ params, searchParams }: ListingDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : "";
  const message = typeof query.message === "string" ? query.message : "";

  const data = await getListingById(id);
  if (!data) {
    notFound();
  }

  const user = await getCurrentUser();
  const isOwner = user?.id === data.listing.owner_id;

  if (!data.listing.is_active && !isOwner) {
    notFound();
  }

  const detailFields = getListingDetailFields({
    category: data.listing.category,
    subCategory: data.listing.sub_category,
    itemInfo: data.listing.item_info,
  });

  return (
    <div className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      {message ? <Alert message={message} type="success" /> : null}
      {error ? <Alert message={error} type="error" /> : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-6">
          <ListingImageCarousel
            images={data.listing.image_urls}
            alt={`${data.listing.category} listing`}
            className="mb-4 rounded-2xl"
            imageContainerClassName="aspect-[4/3]"
            sizes="(max-width: 1024px) 100vw, 66vw"
          />

          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Listing</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950 sm:text-3xl">{data.listing.category}</h1>
          {detailFields.map((field) => (
            <p key={`${field.label}-${field.value}`} className="mt-2 text-sm text-zinc-700">
              <span className="font-medium text-zinc-800">{field.label}:</span> {field.value}
            </p>
          ))}
          <p className="mt-2 text-sm font-medium text-zinc-800">
            INR {data.listing.price_per_month.toLocaleString("en-IN")} / month
          </p>
          <p className="mt-1 text-sm text-zinc-700">
            Minimum agreement: {data.listing.min_agreement_months}{" "}
            {data.listing.min_agreement_months === 1 ? "month" : "months"}
          </p>
          <p className="mt-0 text-xs font-mono tracking-wide text-zinc-600">Listing ID: {data.listing.listing_id}</p>

          <div className="mt-5 space-y-3 text-sm text-zinc-700">
            <p className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>
                {data.listing.city} - PIN {data.listing.pincode}
              </span>
            </p>
          </div>
        </section>

        <aside className="min-w-0 space-y-4">
          {isOwner ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-sm text-zinc-700">This is your listing.</p>
              <Link href="/my-account" className="mt-4 inline-block">
                <Button variant="secondary">Manage in My Account</Button>
              </Link>
            </div>
          ) : (
            <GetOwnerDetailsCard listingId={data.listing.id} ownerName={data.owner?.full_name ?? null} />
          )}
        </aside>
      </div>
    </div>
  );
}
