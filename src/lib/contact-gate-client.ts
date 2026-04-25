import { type ContactCaptchaChallenge, type RevealedContactDetails } from "@/lib/contact-gate-types";

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

export async function fetchContactChallenge(listingId: string): Promise<ContactCaptchaChallenge> {
  const response = await fetch("/api/contact-gate/challenge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ listingId }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { challenge: ContactCaptchaChallenge };
  return payload.challenge;
}

interface RevealContactInput {
  listingId: string;
  challengeId: string;
  answer: string;
  website?: string;
}

export async function revealContactDetails({
  listingId,
  challengeId,
  answer,
  website = "",
}: RevealContactInput): Promise<RevealedContactDetails> {
  const response = await fetch("/api/contact-gate/reveal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ listingId, challengeId, answer, website }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { details: RevealedContactDetails };
  return payload.details;
}
