import Link from "next/link";
import { BriefcaseBusiness, Camera, CirclePlay, MessageCircle } from "lucide-react";
import { SUPPORTED_CITIES } from "@/lib/cities";
import { LISTABLE_ITEMS } from "@/lib/listable-items";

const rentItOutLinks = [
  { label: "About Us", href: "/about-us" },
  { label: "Careers", href: "/careers" },
  { label: "Rental Agreement Templates", href: "/rental-agreement-templates" },
];

const policyLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms and Conditions", href: "/terms-and-conditions" },
];

const socialLinks = [
  { label: "Instagram", href: "#linkholder-instagram", Icon: Camera },
  { label: "LinkedIn", href: "#linkholder-linkedin", Icon: BriefcaseBusiness },
  { label: "Twitter", href: "#linkholder-twitter", Icon: MessageCircle },
  { label: "YouTube", href: "#linkholder-youtube", Icon: CirclePlay },
];

const categoryLinks = LISTABLE_ITEMS.map((category) => ({
  label: category,
  href: {
    pathname: "/browse",
    query: { category },
  },
}));

const cityLinks = SUPPORTED_CITIES.map((city) => ({
  label: city,
  href: {
    pathname: "/browse",
    query: { city },
  },
}));

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-zinc-800 bg-black text-white">
      <div className="mx-auto grid w-full gap-8 px-4 py-10 sm:px-6 sm:py-12 sm:grid-cols-2 lg:grid-cols-5">
        <section>
          <h3 className="text-lg font-semibold tracking-wide">Category</h3>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {categoryLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold tracking-wide">Cities</h3>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {cityLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold tracking-wide">RentItOut</h3>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {rentItOutLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold tracking-wide">Policies</h3>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {policyLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="sm:col-span-2 lg:col-span-1">
          <h3 className="text-lg font-semibold tracking-wide">Social Media</h3>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {socialLinks.map(({ label, href, Icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 text-zinc-300 transition hover:border-zinc-400 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
          <div className="mt-5 space-y-1 text-sm text-zinc-300">
            <p className="font-medium text-white">Contact</p>
            <p>
              Email:{" "}
              <a href="mailto:devashishshrivastavwork@gmail.com" className="break-all hover:text-white">
                devashishshrivastavwork@gmail.com
              </a>
            </p>
            <p>
              Phone:{" "}
              <a href="tel:9968415767" className="hover:text-white">
                9968415767
              </a>
            </p>
          </div>
        </section>
      </div>
      <div className="border-t border-zinc-800 px-4 py-4 text-center text-xs text-zinc-400 sm:px-6">
        {new Date().getFullYear()} RentItOut. Early-access marketplace platform.
      </div>
    </footer>
  );
}
