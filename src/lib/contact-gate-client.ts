import { type RevealedContactDetails } from "@/lib/contact-gate-types";

interface ContactGateErrorPayload {
  error?: string;
}

async function readErrorMessage(response: Response) {
  const fallback = "Request failed";
  try {
    const payload = (await response.json()) as ContactGateErrorPayload;
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

interface RevealContactInput {
  listingId: string;
  recaptchaToken: string;
  website?: string;
}

export async function revealContactDetails({
  listingId,
  recaptchaToken,
  website = "",
}: RevealContactInput): Promise<RevealedContactDetails> {
  const response = await fetch("/api/contact-gate/reveal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ listingId, recaptchaToken, website }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { details: RevealedContactDetails };
  return payload.details;
}
