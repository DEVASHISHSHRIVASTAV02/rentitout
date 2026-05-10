interface ListingImagesErrorPayload {
  error?: string;
}

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
  const response = await fetch(`/api/listings/${encodeURIComponent(listingId)}/images`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { images: string[] };
  return payload.images;
}
