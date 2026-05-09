"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  ensureProfile,
  requireUser,
  requestSignInOtp,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  verifySignInOtp,
} from "@/lib/auth";
import { SUPPORTED_CITIES } from "@/lib/cities";
import { clearListingByIdCache, clearPublicListingsCache } from "@/lib/data";
import { query, queryWithClient, withTransaction } from "@/lib/db";
import { LISTABLE_ITEMS } from "@/lib/listable-items";
import {
  archiveListingImagesForDeletion,
  removeDeletedListingArchiveImages,
  removeListingImages,
  saveListingImage,
} from "@/lib/storage";

const listingSchema = z
  .object({
    category: z.enum(LISTABLE_ITEMS),
    subCategory: z.string().trim().min(1, "Sub category is required").max(80),
    itemInfo: z.string().trim().min(1, "Item info is required").max(80),
    pricePerMonth: z.coerce.number().int().min(1, "Price per month is required"),
    minAgreementMonths: z.coerce.number().int().min(1).max(24),
    city: z.string().trim().min(1, "City is required").max(60),
    pincode: z
      .string()
      .trim()
      .min(1, "Pincode is required")
      .regex(/^\d{6}$/, "Pincode must be a 6-digit number"),
    contactEmail: z.string().trim().email(),
    contactPhone: z.string().trim().max(20).optional().or(z.literal("")),
  });

const profileSchema = z.object({
  fullName: z.string().min(2).max(80),
  city: z.string().min(2).max(60),
  phone: z.string().min(8).max(20),
  showEmailOnListing: z.boolean(),
  showPhoneOnListing: z.boolean(),
});

const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80),
    email: z.string().trim().email(),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const otpRequestSchema = z.object({
  email: z.string().email(),
  next: z.string().optional(),
});

const otpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(10),
  next: z.string().optional(),
});

const MAX_LISTING_IMAGES = 4;
const MAX_LISTING_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_LISTING_ID_GENERATION_ATTEMPTS = 40;

interface DeleteListingRow {
  id: string;
  listing_id: string;
  owner_id: string;
  category: string;
  sub_category: string | null;
  item_info: string | null;
  price_per_month: number;
  min_agreement_months: number;
  city: string;
  pincode: string;
  contact_email: string;
  phone: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface DeleteListingImageRow {
  image_url: string;
  sort_order: number;
  mime_type: string | null;
  file_size_bytes: number | null;
}

interface DeleteAccountListingImageRow {
  image_url: string;
}

interface DeleteAccountArchivedImageRow {
  archived_image_url: string;
}

function formatAuthDbError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.toLowerCase().includes("database_url")) {
    return "Database is not configured. Set DATABASE_URL in .env.local and restart the dev server.";
  }
  return message || "Authentication failed";
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code: string }).code === "23505"
  );
}

function getCategoryInitials(category: string) {
  const normalized = category.replace(/[^a-zA-Z\s]/g, " ").trim();
  if (!normalized) {
    return "LX";
  }

  const words = normalized.split(/\s+/).filter((entry) => entry.length > 0);
  if (words.length > 1) {
    return words.map((entry) => entry.charAt(0)).join("").slice(0, 3).toUpperCase();
  }

  return words[0].slice(0, 2).toUpperCase();
}

function getTimePart(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}${minutes}${seconds}`;
}

function getRandomFiveDigitCode() {
  return String(Math.floor(Math.random() * 99999) + 1).padStart(5, "0");
}

function createPublicListingId(category: string) {
  return `${getCategoryInitials(category)}-${getTimePart(new Date())}-${getRandomFiveDigitCode()}`;
}

function appendQueryParam(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function asOptionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : undefined;
}

function isFileEntry(value: FormDataEntryValue): value is File {
  return typeof value !== "string";
}

function getListingImageFiles(formData: FormData) {
  return formData.getAll("images").filter(isFileEntry).filter((file) => file.size > 0);
}

function validateListingImageFiles(files: File[], required: boolean) {
  if (required && files.length === 0) {
    return "Upload at least 1 image";
  }
  if (files.length > MAX_LISTING_IMAGES) {
    return `Upload up to ${MAX_LISTING_IMAGES} images only`;
  }

  for (const file of files) {
    if (file.size > MAX_LISTING_IMAGE_SIZE_BYTES) {
      return "Each image must be 8MB or smaller";
    }
    if (file.type && !ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
      return "Only JPG, PNG, or WEBP images are allowed";
    }
  }

  return null;
}

async function saveListingImages(files: File[], userId: string) {
  const saved = await Promise.all(files.map((file) => saveListingImage(file, userId)));
  return saved.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Invalid sign up details";
    redirect(`/auth/sign-up?error=${encodeURIComponent(issue)}`);
  }

  try {
    await signUpWithPassword({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      password: parsed.data.password,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      redirect(`/auth/sign-up?error=${encodeURIComponent("Account with this email already exists")}`);
    }
    const message = formatAuthDbError(error);
    redirect(`/auth/sign-up?error=${encodeURIComponent(message)}`);
  }

  redirect("/browse?message=Account created");
}

export async function signInAction(formData: FormData) {
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const next = formData.get("next")?.toString() ?? "/my-account";

  let user: Awaited<ReturnType<typeof signInWithPassword>>;
  try {
    user = await signInWithPassword({ email, password });
    await ensureProfile(user);
  } catch (error) {
    const message = formatAuthDbError(error);
    redirect(`/auth/sign-in?error=${encodeURIComponent(message)}`);
  }

  redirect(next.startsWith("/") ? next : "/my-account");
}

export async function requestOtpAction(formData: FormData) {
  const parsed = otpRequestSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Invalid email";
    redirect(`/auth/sign-in?error=${encodeURIComponent(issue)}`);
  }

  const next = parsed.data.next?.toString() ?? "/my-account";
  const email = parsed.data.email;

  try {
    await requestSignInOtp(email);
  } catch (error) {
    const message = formatAuthDbError(error);
    redirect(
      `/auth/sign-in?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}&otpEmail=${encodeURIComponent(email)}`,
    );
  }

  redirect(
    `/auth/sign-in?message=${encodeURIComponent("OTP sent to your email")}&next=${encodeURIComponent(next)}&otpEmail=${encodeURIComponent(email)}`,
  );
}

export async function verifyOtpAction(formData: FormData) {
  const parsed = otpVerifySchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Invalid OTP";
    redirect(`/auth/sign-in?error=${encodeURIComponent(issue)}`);
  }

  const next = parsed.data.next?.toString() ?? "/my-account";
  const email = parsed.data.email;

  let user: Awaited<ReturnType<typeof verifySignInOtp>>;
  try {
    user = await verifySignInOtp({
      email,
      otp: parsed.data.otp,
    });
    await ensureProfile(user);
  } catch (error) {
    const message = formatAuthDbError(error);
    redirect(
      `/auth/sign-in?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}&otpEmail=${encodeURIComponent(email)}`,
    );
  }

  redirect(next.startsWith("/") ? next : "/my-account");
}

export async function signOutAction() {
  await signOut();
  redirect("/");
}

export async function deleteAccountAction() {
  const user = await requireUser();
  let listingImageUrls: string[] = [];
  let archivedImageUrls: string[] = [];

  try {
    await withTransaction(async (client) => {
      const { rows: listingImageRows } = await queryWithClient<DeleteAccountListingImageRow>(
        client,
        `
          select li.image_url
          from listing l
          inner join listing_images li on li.listing_id = l.listing_id
          where l.owner_id = $1
        `,
        [user.id],
      );
      listingImageUrls = listingImageRows.map((row) => row.image_url);

      const { rows: archivedImageRows } = await queryWithClient<DeleteAccountArchivedImageRow>(
        client,
        `
          select dli.archived_image_url
          from deleted_listing dl
          inner join deleted_listing_images dli on dli.deleted_listing_id = dl.id
          where dl.owner_id = $1
             or dl.deleted_by_user_id = $1
        `,
        [user.id],
      );
      archivedImageUrls = archivedImageRows.map((row) => row.archived_image_url);

      await queryWithClient(
        client,
        `
          delete from deleted_listing
          where owner_id = $1
             or deleted_by_user_id = $1
        `,
        [user.id],
      );

      const { rowCount } = await queryWithClient(
        client,
        `
          delete from users
          where id = $1
        `,
        [user.id],
      );

      if (!rowCount) {
        throw new Error("Could not delete account");
      }
    });
  } catch {
    redirect(`/my-account?error=${encodeURIComponent("Could not delete account")}`);
  }

  if (listingImageUrls.length > 0) {
    try {
      await removeListingImages(listingImageUrls);
    } catch {
      // Best effort cleanup for listing image files after account removal.
    }
  }

  if (archivedImageUrls.length > 0) {
    try {
      await removeDeletedListingArchiveImages(archivedImageUrls);
    } catch {
      // Best effort cleanup for deleted listing archive files after account removal.
    }
  }

  revalidatePath("/browse");
  revalidatePath("/my-account");
  revalidatePath("/");
  clearPublicListingsCache();
  clearListingByIdCache();

  await signOut();
  redirect("/browse?message=Account deleted successfully");
}

export async function createListingAction(formData: FormData) {
  const redirectToInput = formData.get("redirectTo")?.toString() ?? "/browse";
  const redirectTo = redirectToInput.startsWith("/") ? redirectToInput : "/browse";
  const redirectWithError = (message: string): never => redirect(appendQueryParam(redirectTo, "error", message));

  const user = await requireUser();
  await ensureProfile(user);

  const parsedListingInput = listingSchema.safeParse({
    category: asString(formData.get("category")),
    subCategory: asString(formData.get("subCategory")),
    itemInfo: asString(formData.get("itemInfo")),
    pricePerMonth: asString(formData.get("pricePerMonth")),
    minAgreementMonths: asString(formData.get("minAgreementMonths")),
    city: asString(formData.get("city")),
    pincode: asString(formData.get("pincode")),
    contactEmail: asString(formData.get("contactEmail")) || user.email || "",
    contactPhone: asOptionalString(formData.get("contactPhone")),
  });

  if (!parsedListingInput.success) {
    const message = parsedListingInput.error.issues[0]?.message ?? "Invalid listing data";
    redirectWithError(message);
  }
  const listingInput = parsedListingInput.data as z.infer<typeof listingSchema>;

  if (!SUPPORTED_CITIES.some((entry) => entry === listingInput.city)) {
    redirectWithError("Please select a city from the list");
  }

  const imageFiles = getListingImageFiles(formData);
  const imageValidationError = validateListingImageFiles(imageFiles, true);
  if (imageValidationError) {
    redirectWithError(imageValidationError);
  }

  const imageUrls = await saveListingImages(imageFiles, user.id);
  if (imageUrls.length === 0 || imageUrls.length !== imageFiles.length) {
    redirectWithError("Could not process uploaded images");
  }

  let createdListingId = "";
  try {
    createdListingId = await withTransaction(async (client) => {
      let createdListing: { id: string; listing_id: string } | undefined;

      for (let attempt = 0; attempt < MAX_LISTING_ID_GENERATION_ATTEMPTS; attempt += 1) {
        const nextPublicListingId = createPublicListingId(listingInput.category);
        const { rowCount: existingListingIdCount } = await queryWithClient(
          client,
          `
            select 1
            from listing
            where listing_id = $1
            limit 1
          `,
          [nextPublicListingId],
        );
        if (existingListingIdCount) {
          continue;
        }

        const { rows } = await queryWithClient<{ id: string; listing_id: string }>(
          client,
          `
            insert into listing
              (
                listing_id,
                owner_id,
                category,
                sub_category,
                item_info,
                price_per_month,
                min_agreement_months,
                contact_email,
                city,
                pincode,
                phone
              )
            values
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            on conflict (listing_id) do nothing
            returning id, listing_id
          `,
          [
            nextPublicListingId,
            user.id,
            listingInput.category,
            listingInput.subCategory,
            listingInput.itemInfo.trim(),
            listingInput.pricePerMonth,
            listingInput.minAgreementMonths,
            listingInput.contactEmail,
            listingInput.city,
            listingInput.pincode,
            listingInput.contactPhone?.trim() || null,
          ],
        );
        createdListing = rows[0];
        if (createdListing) {
          break;
        }
      }

      if (!createdListing) {
        throw new Error("Could not generate a unique listing ID");
      }

      for (const [sortOrder, imageUrl] of imageUrls.entries()) {
        await queryWithClient(
          client,
          `
            insert into listing_images (listing_id, image_url, sort_order)
            values ($1, $2, $3)
          `,
          [createdListing.listing_id, imageUrl, sortOrder],
        );
      }

      return createdListing.id;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create listing";
    redirectWithError(message);
  }

  revalidatePath("/my-account");
  revalidatePath("/browse");
  revalidatePath(`/listings/${createdListingId}`);
  revalidatePath("/");
  clearPublicListingsCache();
  clearListingByIdCache(createdListingId);
  redirect(appendQueryParam(redirectTo, "message", "Listing created"));
}

export async function updateListingAction(formData: FormData) {
  const redirectToInput = formData.get("redirectTo")?.toString() ?? "/my-account";
  const redirectTo = redirectToInput.startsWith("/") ? redirectToInput : "/my-account";
  const redirectWithError = (message: string): never => redirect(appendQueryParam(redirectTo, "error", message));

  const user = await requireUser();
  await ensureProfile(user);

  const listingId = formData.get("listingId")?.toString() ?? "";
  if (!listingId) {
    redirectWithError("Missing listing id");
  }

  const { rows: existingRows } = await query<{ id: string; listing_id: string }>(
    `
      select id, listing_id
      from listing
      where id = $1
        and owner_id = $2
      limit 1
    `,
    [listingId, user.id],
  );

  const existingListing = existingRows[0];
  if (!existingListing) {
    redirectWithError("Listing not found");
  }

  const parsedListingInput = listingSchema.safeParse({
    category: asString(formData.get("category")),
    subCategory: asString(formData.get("subCategory")),
    itemInfo: asString(formData.get("itemInfo")),
    pricePerMonth: asString(formData.get("pricePerMonth")),
    minAgreementMonths: asString(formData.get("minAgreementMonths")),
    city: asString(formData.get("city")),
    pincode: asString(formData.get("pincode")),
    contactEmail: asString(formData.get("contactEmail")) || user.email || "",
    contactPhone: asOptionalString(formData.get("contactPhone")),
  });

  if (!parsedListingInput.success) {
    const message = parsedListingInput.error.issues[0]?.message ?? "Invalid listing data";
    redirectWithError(message);
  }
  const listingInput = parsedListingInput.data as z.infer<typeof listingSchema>;

  if (!SUPPORTED_CITIES.some((entry) => entry === listingInput.city)) {
    redirectWithError("Please select a city from the list");
  }

  const imageFiles = getListingImageFiles(formData);
  const imageValidationError = validateListingImageFiles(imageFiles, false);
  if (imageValidationError) {
    redirectWithError(imageValidationError);
  }

  let replacementImageUrls: string[] | null = null;
  if (imageFiles.length > 0) {
    const imageUrls = await saveListingImages(imageFiles, user.id);
    if (imageUrls.length === 0 || imageUrls.length !== imageFiles.length) {
      redirectWithError("Could not process uploaded images");
    }
    replacementImageUrls = imageUrls;
  }

  try {
    await withTransaction(async (client) => {
      const { rowCount } = await queryWithClient(
        client,
        `
          update listing
          set
            category = $1,
            sub_category = $2,
            item_info = $3,
            price_per_month = $4,
            min_agreement_months = $5,
            contact_email = $6,
            city = $7,
            pincode = $8,
            phone = $9
          where id = $10
            and owner_id = $11
        `,
        [
          listingInput.category,
          listingInput.subCategory,
          listingInput.itemInfo.trim(),
          listingInput.pricePerMonth,
          listingInput.minAgreementMonths,
          listingInput.contactEmail,
          listingInput.city,
          listingInput.pincode,
          listingInput.contactPhone?.trim() || null,
          listingId,
          user.id,
        ],
      );

      if (!rowCount) {
        throw new Error("Could not update listing");
      }

      if (!replacementImageUrls) {
        return;
      }

      await queryWithClient(client, "delete from listing_images where listing_id = $1", [existingListing.listing_id]);

      for (const [sortOrder, imageUrl] of replacementImageUrls.entries()) {
        await queryWithClient(
          client,
          `
            insert into listing_images (listing_id, image_url, sort_order)
            values ($1, $2, $3)
          `,
          [existingListing.listing_id, imageUrl, sortOrder],
        );
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update listing";
    redirectWithError(message);
  }

  revalidatePath("/my-account");
  revalidatePath("/browse");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/");
  clearPublicListingsCache();
  clearListingByIdCache(listingId);
  redirect(appendQueryParam(redirectTo, "message", "Listing updated"));
}

export async function deleteListingAction(formData: FormData) {
  const user = await requireUser();
  const listingId = formData.get("listingId")?.toString() ?? "";

  if (!listingId) {
    redirect("/my-account?error=Missing listing id");
  }

  let originalImageUrls: string[] = [];
  let archivedImageUrls: string[] = [];

  try {
    await withTransaction(async (client) => {
      const { rows: listingRows } = await queryWithClient<DeleteListingRow>(
        client,
        `
          select
            id,
            listing_id,
            owner_id,
            category,
            sub_category,
            item_info,
            price_per_month,
            min_agreement_months,
            city,
            pincode,
            contact_email,
            phone,
            is_active,
            created_at,
            updated_at
          from listing
          where id = $1
            and owner_id = $2
          limit 1
          for update
        `,
        [listingId, user.id],
      );

      const listing = listingRows[0];
      if (!listing) {
        throw new Error("Could not remove listing");
      }

      const { rows: listingImageRows } = await queryWithClient<DeleteListingImageRow>(
        client,
        `
          select image_url, sort_order, mime_type, file_size_bytes
          from listing_images
          where listing_id = $1
          order by sort_order asc
        `,
        [listing.listing_id],
      );

      originalImageUrls = listingImageRows.map((entry) => entry.image_url);

      const archivedImages = await archiveListingImagesForDeletion(
        listing.listing_id,
        listingImageRows.map((entry) => ({
          imageUrl: entry.image_url,
          sortOrder: entry.sort_order,
          mimeType: entry.mime_type,
          fileSizeBytes: entry.file_size_bytes,
        })),
      );
      archivedImageUrls = archivedImages.map((entry) => entry.archivedImageUrl);

      const { rows: deletedListingRows } = await queryWithClient<{ id: string }>(
        client,
        `
          insert into deleted_listing
            (
              original_listing_row_id,
              original_listing_id,
              owner_id,
              category,
              sub_category,
              item_info,
              price_per_month,
              min_agreement_months,
              city,
              pincode,
              contact_email,
              phone,
              was_active,
              listing_created_at,
              listing_updated_at,
              deleted_by_user_id
            )
          values
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          returning id
        `,
        [
          listing.id,
          listing.listing_id,
          listing.owner_id,
          listing.category,
          listing.sub_category,
          listing.item_info,
          listing.price_per_month,
          listing.min_agreement_months,
          listing.city,
          listing.pincode,
          listing.contact_email,
          listing.phone,
          listing.is_active,
          listing.created_at,
          listing.updated_at,
          user.id,
        ],
      );

      const deletedListing = deletedListingRows[0];
      if (!deletedListing) {
        throw new Error("Could not archive listing before deletion");
      }

      for (const image of archivedImages) {
        await queryWithClient(
          client,
          `
            insert into deleted_listing_images
              (
                deleted_listing_id,
                original_image_url,
                archived_image_url,
                sort_order,
                mime_type,
                file_size_bytes
              )
            values
              ($1, $2, $3, $4, $5, $6)
          `,
          [
            deletedListing.id,
            image.originalImageUrl,
            image.archivedImageUrl,
            image.sortOrder,
            image.mimeType,
            image.fileSizeBytes,
          ],
        );
      }

      const { rowCount } = await queryWithClient(
        client,
        `
          delete from listing
          where id = $1
            and owner_id = $2
        `,
        [listingId, user.id],
      );

      if (!rowCount) {
        throw new Error("Could not remove listing");
      }
    });
  } catch {
    if (archivedImageUrls.length > 0) {
      try {
        await removeDeletedListingArchiveImages(archivedImageUrls);
      } catch {
        // Best effort rollback cleanup for copied archive files.
      }
    }

    redirect(`/my-account?error=${encodeURIComponent("Could not remove listing")}`);
  }

  if (originalImageUrls.length > 0) {
    try {
      await removeListingImages(originalImageUrls);
    } catch {
      // Best effort cleanup for old image files after successful delete+archive.
    }
  }

  revalidatePath("/my-account");
  revalidatePath("/browse");
  revalidatePath("/");
  clearPublicListingsCache();
  clearListingByIdCache(listingId);
  redirect("/my-account?message=Listing removed");
}

export async function toggleListingStatusAction(formData: FormData) {
  const user = await requireUser();
  const listingId = formData.get("listingId")?.toString() ?? "";
  const isActive = formData.get("isActive")?.toString() === "true";

  if (!listingId) {
    redirect("/my-account?error=Missing listing id");
  }

  const { rowCount } = await query(
    `
      update listing
      set is_active = $1
      where id = $2
        and owner_id = $3
    `,
    [!isActive, listingId, user.id],
  );

  if (!rowCount) {
    redirect(`/my-account?error=${encodeURIComponent("Could not update listing")}`);
  }

  revalidatePath("/my-account");
  revalidatePath("/browse");
  revalidatePath("/");
  clearPublicListingsCache();
  clearListingByIdCache(listingId);
  redirect("/my-account?message=Listing updated");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    city: formData.get("city"),
    phone: formData.get("phone"),
    showEmailOnListing: formData.get("showEmailOnListing") === "on",
    showPhoneOnListing: formData.get("showPhoneOnListing") === "on",
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Invalid profile details";
    redirect(`/my-account?error=${encodeURIComponent(issue)}`);
  }

  const { rowCount } = await query(
    `
      insert into profiles (id, email, full_name, city, phone, show_email_on_listing, show_phone_on_listing)
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (id) do update
      set
        email = excluded.email,
        full_name = excluded.full_name,
        city = excluded.city,
        phone = excluded.phone,
        show_email_on_listing = excluded.show_email_on_listing,
        show_phone_on_listing = excluded.show_phone_on_listing
    `,
    [
      user.id,
      user.email,
      parsed.data.fullName,
      parsed.data.city,
      parsed.data.phone,
      parsed.data.showEmailOnListing,
      parsed.data.showPhoneOnListing,
    ],
  );

  if (!rowCount) {
    redirect(`/my-account?error=${encodeURIComponent("Could not update profile")}`);
  }

  revalidatePath("/my-account");
  revalidatePath("/browse");
  clearListingByIdCache();
  redirect("/my-account?message=Profile updated");
}
