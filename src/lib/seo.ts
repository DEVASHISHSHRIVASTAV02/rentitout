import type { Metadata } from "next";

export const SITE_NAME = "RentItOut";

const DEFAULT_APP_URL = "https://rentitout.in";
const DEFAULT_OG_IMAGE_PATH = "/favicon.ico";

const BASE_KEYWORDS = [
  "appliance rental",
  "rent appliances",
  "rent furniture",
  "city rental listings",
  "monthly appliance rent",
  "RentItOut",
];

function normalizeBaseUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return DEFAULT_APP_URL;
  }

  try {
    const parsed = new URL(trimmed);
    return `${parsed.origin}/`;
  } catch {
    return DEFAULT_APP_URL;
  }
}

export const APP_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL);
export const APP_ORIGIN = new URL(APP_BASE_URL).origin;

export function toAbsoluteUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, APP_BASE_URL).toString();
}

interface BuildPageMetadataOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
}

export function buildPageMetadata(options: BuildPageMetadataOptions): Metadata {
  const pageKeywords = options.keywords ? [...BASE_KEYWORDS, ...options.keywords] : BASE_KEYWORDS;

  return {
    title: options.title,
    description: options.description,
    keywords: pageKeywords,
    alternates: {
      canonical: options.path,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: options.path,
      title: `${options.title} | ${SITE_NAME}`,
      description: options.description,
      images: [
        {
          url: DEFAULT_OG_IMAGE_PATH,
          width: 256,
          height: 256,
          alt: "RentItOut",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${options.title} | ${SITE_NAME}`,
      description: options.description,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
    robots: options.noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
            nosnippet: true,
          },
        }
      : {
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
}
