import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard",
  description: "RentItOut owner dashboard.",
  path: "/dashboard",
  noIndex: true,
});

export default function DashboardPage() {
  redirect("/my-account");
}
