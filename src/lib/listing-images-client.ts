interface ListingImagesErrorPayload {
  error?: string;
}

const listingImagesCache = new Map<string, string[]>();
const listingImagesInFlight = new Map<string, Promise<string[]>>();

async function readErrorMessage(response: Response) {
  const fallback = "Unable to load listing images";
  try {
    const payload = (await response.json()) as ListingImagesErrorPayload;
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchListingImages(listingId: string): Promise<string[]> {
  const cached = listingImagesCache.get(listingId);
  if (cached) {
    return cached;
  }

  const existingInFlight = listingImagesInFlight.get(listingId);
  if (existingInFlight) {
    return existingInFlight;
  }

  const request = (async () => {
    const response = await fetch(`/api/listings/${encodeURIComponent(listingId)}/images`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const payload = (await response.json()) as { images: string[] };
    const images = payload.images.filter((entry) => typeof entry === "string" && entry.trim().length > 0);
    listingImagesCache.set(listingId, images);
    return images;
  })();

  listingImagesInFlight.set(listingId, request);
  try {
    return await request;
  } finally {
    listingImagesInFlight.delete(listingId);
  }
}
