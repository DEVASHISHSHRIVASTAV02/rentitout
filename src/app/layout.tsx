import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { EarlyPhaseNotice } from "@/components/early-phase-notice";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { APP_BASE_URL, SITE_NAME } from "@/lib/seo";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const headingFont = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_BASE_URL),
  title: {
    default: "Rent Appliances and Home Essentials in Your City",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Browse verified appliance rental listings by city, category, budget, and agreement duration on RentItOut.",
  keywords: [
    "appliance rental marketplace",
    "rent appliances online",
    "city rental listings",
    "short term appliance rent",
    "RentItOut",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    title: "Rent Appliances and Home Essentials in Your City",
    description:
      "Browse verified appliance rental listings by city, category, budget, and agreement duration on RentItOut.",
    images: [
      {
        url: "/favicon.ico",
        width: 256,
        height: 256,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rent Appliances and Home Essentials in Your City",
    description:
      "Browse verified appliance rental listings by city, category, budget, and agreement duration on RentItOut.",
    images: ["/favicon.ico"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}>
      <body className="min-h-full overflow-x-hidden bg-white text-zinc-900">
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <EarlyPhaseNotice />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
