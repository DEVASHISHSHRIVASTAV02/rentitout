import { z } from "zod";
import {
  ContactGateError,
  createContactChallenge,
  getContactGateRequestContext,
} from "@/lib/contact-gate-server";

export const dynamic = "force-dynamic";

const challengeSchema = z.object({
  listingId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const payload = challengeSchema.parse(await request.json());
    const context = getContactGateRequestContext(request);
    const challenge = createContactChallenge(payload.listingId, context);
    return Response.json({ challenge });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload" }, { status: 400 });
    }
    if (error instanceof ContactGateError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Unable to create challenge right now" }, { status: 500 });
  }
}
