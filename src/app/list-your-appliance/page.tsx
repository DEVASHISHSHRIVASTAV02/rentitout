import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { buildPageMetadata } from "@/lib/seo";

const NEW_LISTING_PATH = "/my-account?newListing=1";

export const metadata: Metadata = buildPageMetadata({
  title: "List Your Appliance",
  description: "Start creating a RentItOut appliance listing.",
  path: "/list-your-appliance",
  noIndex: true,
});

export default async function ListYourAppliancePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(NEW_LISTING_PATH)}`);
  }

  redirect(NEW_LISTING_PATH);
}
