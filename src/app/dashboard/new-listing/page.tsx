import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Create Listing",
  description: "Create a new appliance listing on RentItOut.",
  path: "/dashboard/new-listing",
  noIndex: true,
});

export default function NewListingPage() {
  redirect("/my-account");
}
