export interface ContactCaptchaChallenge {
  challengeId: string;
  captchaSvgDataUrl: string;
  expiresInSeconds: number;
  minSolveSeconds: number;
}

export interface RevealedContactDetails {
  ownerName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}
