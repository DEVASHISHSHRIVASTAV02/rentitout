import { z } from "zod";
import { getPublicListingImagesById } from "@/lib/data";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

interface ListingImagesRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: ListingImagesRouteContext) {
  const parsedParams = paramsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return Response.json({ error: "Invalid listing id" }, { status: 400 });
  }

  const imageUrls = await getPublicListingImagesById(parsedParams.data.id);
  if (!imageUrls) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }

  return Response.json({ images: imageUrls });
}
