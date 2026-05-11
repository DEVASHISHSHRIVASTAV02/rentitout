import { formatCurrencyINR } from "@/lib/utils";

interface SendEmailInput {
  to: string[];
  subject: string;
  html: string;
  text: string;
}

interface ListingProofEmailInput {
  ownerEmail: string | null;
  ownerName: string | null;
  listing: {
    id: string;
    title: string;
    category: string;
    city: string;
    dailyRate: number;
    depositAmount: number;
    imageUrl: string | null;
  };
}

interface OtpEmailInput {
  email: string;
  otp: string;
  expiresInMinutes: number;
}

interface ResendErrorPayload {
  name?: string;
  message?: string;
  statusCode?: number;
}

function getEmailEnv() {
  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    fromEmail: process.env.EMAIL_FROM ?? "",
    appBaseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    listingReviewEmail: process.env.LISTING_PROOF_REVIEW_EMAIL ?? "",
  };
}

function sanitizeRecipients(recipients: Array<string | null | undefined>) {
  return recipients
    .flatMap((entry) => (entry ?? "").split(","))
    .map((entry) => entry.trim())
    .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index);
}

function parseResendErrorPayload(payloadText: string) {
  try {
    const parsed = JSON.parse(payloadText) as ResendErrorPayload;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    // Ignore parse errors and use the plain payload text as fallback.
  }

  return null;
}

function getResendSendErrorMessage(status: number, payloadText: string) {
  const parsedPayload = parseResendErrorPayload(payloadText);
  const providerMessage = (parsedPayload?.message ?? payloadText).trim();
  const normalizedProviderMessage = providerMessage.toLowerCase();

  if (
    status === 403 &&
    normalizedProviderMessage.includes("you can only send testing emails to your own email address")
  ) {
    return "OTP email is blocked because Resend is still in test sender mode. Verify your domain in Resend and set EMAIL_FROM to that domain.";
  }

  if (status === 422 && normalizedProviderMessage.includes("invalid `from` field")) {
    return "Email sender format is invalid. Set EMAIL_FROM as Name <email@yourdomain.com> using a verified Resend domain.";
  }

  if (status === 401) {
    return "Email provider authentication failed. Check RESEND_API_KEY.";
  }

  if (status === 429) {
    return "Email provider is rate-limiting requests. Please try again shortly.";
  }

  if (status >= 500) {
    return "Email provider is temporarily unavailable. Please try again shortly.";
  }

  return providerMessage || "Email could not be sent at this time.";
}

async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const { apiKey, fromEmail } = getEmailEnv();
  if (!apiKey || !fromEmail || to.length === 0) {
    return { sent: false, skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const payloadText = await response.text().catch(() => "");
    const failureMessage = getResendSendErrorMessage(response.status, payloadText);
    throw new Error(failureMessage);
  }

  return { sent: true, skipped: false };
}

export async function sendOtpEmail(input: OtpEmailInput) {
  const subject = "Your RentItOut sign-in OTP";
  const text = [
    "Use this OTP to sign in to RentItOut:",
    input.otp,
    "",
    `This OTP expires in ${input.expiresInMinutes} minutes.`,
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  const html = `
    <h2>RentItOut Sign-in OTP</h2>
    <p>Use this OTP to sign in:</p>
    <p style="font-size: 24px; font-weight: 700; letter-spacing: 2px;">${input.otp}</p>
    <p>This OTP expires in ${input.expiresInMinutes} minutes.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  return sendEmail({
    to: [input.email],
    subject,
    html,
    text,
  });
}

export async function sendListingProofEmails(input: ListingProofEmailInput) {
  const { listingReviewEmail, appBaseUrl } = getEmailEnv();
  const ownerRecipients = sanitizeRecipients([input.ownerEmail]);
  const reviewRecipients = sanitizeRecipients([listingReviewEmail]);

  const listingUrl = `${appBaseUrl}/listings/${input.listing.id}`;
  const ownerName = input.ownerName || "Owner";
  const amountLine = `${formatCurrencyINR(input.listing.dailyRate)} / day`;
  const depositLine = formatCurrencyINR(input.listing.depositAmount);

  const ownerSubject = `Listing proof received: ${input.listing.title}`;
  const ownerText = [
    `Hi ${ownerName},`,
    "",
    "Your listing has been submitted to RentItOut.",
    `Title: ${input.listing.title}`,
    `Category: ${input.listing.category}`,
    `City: ${input.listing.city}`,
    `Rent: ${amountLine}`,
    `Deposit: ${depositLine}`,
    `Listing URL: ${listingUrl}`,
    input.listing.imageUrl ? `Image URL: ${input.listing.imageUrl}` : "Image URL: Not provided",
  ].join("\n");
  const ownerHtml = `
    <h2>Listing Proof Received</h2>
    <p>Hi ${ownerName},</p>
    <p>Your listing has been submitted to RentItOut.</p>
    <ul>
      <li><strong>Title:</strong> ${input.listing.title}</li>
      <li><strong>Category:</strong> ${input.listing.category}</li>
      <li><strong>City:</strong> ${input.listing.city}</li>
      <li><strong>Rent:</strong> ${amountLine}</li>
      <li><strong>Deposit:</strong> ${depositLine}</li>
      <li><strong>Listing URL:</strong> <a href="${listingUrl}">${listingUrl}</a></li>
      <li><strong>Image URL:</strong> ${input.listing.imageUrl ? `<a href="${input.listing.imageUrl}">${input.listing.imageUrl}</a>` : "Not provided"}</li>
    </ul>
  `;

  const reviewSubject = `Review required: ${input.listing.title} (${input.listing.city})`;
  const reviewText = [
    "A new listing proof has been submitted.",
    "",
    `Owner: ${ownerName}`,
    `Owner email: ${input.ownerEmail ?? "Unknown"}`,
    `Title: ${input.listing.title}`,
    `Category: ${input.listing.category}`,
    `City: ${input.listing.city}`,
    `Rent: ${amountLine}`,
    `Deposit: ${depositLine}`,
    `Listing URL: ${listingUrl}`,
    input.listing.imageUrl ? `Image URL: ${input.listing.imageUrl}` : "Image URL: Not provided",
  ].join("\n");
  const reviewHtml = `
    <h2>Listing Proof Review</h2>
    <p>A new listing proof has been submitted.</p>
    <ul>
      <li><strong>Owner:</strong> ${ownerName}</li>
      <li><strong>Owner email:</strong> ${input.ownerEmail ?? "Unknown"}</li>
      <li><strong>Title:</strong> ${input.listing.title}</li>
      <li><strong>Category:</strong> ${input.listing.category}</li>
      <li><strong>City:</strong> ${input.listing.city}</li>
      <li><strong>Rent:</strong> ${amountLine}</li>
      <li><strong>Deposit:</strong> ${depositLine}</li>
      <li><strong>Listing URL:</strong> <a href="${listingUrl}">${listingUrl}</a></li>
      <li><strong>Image URL:</strong> ${input.listing.imageUrl ? `<a href="${input.listing.imageUrl}">${input.listing.imageUrl}</a>` : "Not provided"}</li>
    </ul>
  `;

  try {
    if (ownerRecipients.length > 0) {
      await sendEmail({
        to: ownerRecipients,
        subject: ownerSubject,
        html: ownerHtml,
        text: ownerText,
      });
    }
    if (reviewRecipients.length > 0) {
      await sendEmail({
        to: reviewRecipients,
        subject: reviewSubject,
        html: reviewHtml,
        text: reviewText,
      });
    }
  } catch (error) {
    console.error("Listing proof email error", error);
  }
}
