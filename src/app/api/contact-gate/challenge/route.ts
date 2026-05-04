import { z } from "zod";

export const dynamic = "force-dynamic";

const challengeSchema = z.object({
  listingId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    challengeSchema.parse(await request.json());
    return Response.json(
      { error: "This endpoint is deprecated. Use /api/contact-gate/reveal with recaptchaToken." },
      { status: 410 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload" }, { status: 400 });
    }
    return Response.json({ error: "Unable to create challenge right now" }, { status: 500 });
  }
}
