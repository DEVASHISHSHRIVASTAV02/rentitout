import { z } from "zod";
import {
  ContactGateError,
  getContactGateRequestContext,
  getListingContactDetailsForReveal,
  verifyContactChallenge,
} from "@/lib/contact-gate-server";

export const dynamic = "force-dynamic";

const revealSchema = z.object({
  listingId: z.string().uuid(),
  challengeId: z.string().uuid(),
  answer: z.string().trim().min(1).max(32),
  website: z.string().optional().default(""),
});

export async function POST(request: Request) {
  try {
    const payload = revealSchema.parse(await request.json());

    if (payload.website.trim().length > 0) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const context = getContactGateRequestContext(request);
    verifyContactChallenge(
      {
        listingId: payload.listingId,
        challengeId: payload.challengeId,
        answer: payload.answer,
      },
      context,
    );

    const details = await getListingContactDetailsForReveal(payload.listingId);
    if (!details) {
      return Response.json({ error: "Listing is not available" }, { status: 404 });
    }

    return Response.json({ details });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload" }, { status: 400 });
    }
    if (error instanceof ContactGateError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Unable to reveal contact details right now" }, { status: 500 });
  }
}
