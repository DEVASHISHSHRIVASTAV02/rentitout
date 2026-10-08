import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";
import convert from "heic-convert";
import sharp from "sharp";

function resolveAppRootDir() {
  const fromEnv = process.env.APP_ROOT?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }

  return path.resolve(process.cwd());
}

const APP_ROOT_DIR = resolveAppRootDir();
const PUBLIC_ROOT_DIR = path.join(APP_ROOT_DIR, "public");
const LISTING_IMAGES_RELATIVE_ROOT = path.join("uploads", "listing-images");
const DELETED_LISTING_IMAGES_RELATIVE_ROOT = path.join("uploads", "deleted-listing-images");
const LISTING_IMAGES_ABSOLUTE_ROOT = path.join(PUBLIC_ROOT_DIR, LISTING_IMAGES_RELATIVE_ROOT);
const DELETED_LISTING_IMAGES_ABSOLUTE_ROOT = path.join(PUBLIC_ROOT_DIR, DELETED_LISTING_IMAGES_RELATIVE_ROOT);

export interface ListingImageArchiveInput {
  imageUrl: string;
  sortOrder: number;
  mimeType: string | null;
  fileSizeBytes: number | null;
}

export interface ArchivedListingImage {
  originalImageUrl: string;
  archivedImageUrl: string;
  sortOrder: number;
  mimeType: string | null;
  fileSizeBytes: number | null;
}

function sanitizeDirectoryName(value: string) {
  return value.replace(/[^a-zA-Z0-9\-_]/g, "-");
}

function normalizePublicUrl(value: string) {
  return value.split("?")[0]?.split("#")[0]?.trim() ?? "";
}

function isPathInsideDirectory(targetPath: string, directoryPath: string) {
  const relativePath = path.relative(directoryPath, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function toPublicUrl(absolutePath: string) {
  if (!isPathInsideDirectory(absolutePath, PUBLIC_ROOT_DIR)) {
    throw new Error("Image path is outside public directory");
  }
  const relativePath = path.relative(PUBLIC_ROOT_DIR, absolutePath);
  return `/${relativePath.replace(/\\/g, "/")}`;
}

function resolvePublicFilePath(publicUrl: string, expectedAbsoluteRoot: string) {
  const normalizedUrl = normalizePublicUrl(publicUrl);
  if (!normalizedUrl.startsWith("/")) {
    throw new Error("Image URL must be an absolute public path");
  }

  const relativePath = normalizedUrl.slice(1);
  const absolutePath = path.resolve(PUBLIC_ROOT_DIR, relativePath);
  if (!isPathInsideDirectory(absolutePath, PUBLIC_ROOT_DIR)) {
    throw new Error("Image URL points outside public directory");
  }
  if (!isPathInsideDirectory(absolutePath, expectedAbsoluteRoot)) {
    throw new Error("Image URL path is outside expected storage root");
  }

  return absolutePath;
}

/** Hard cap for each stored listing image after backend compression. */
export const MAX_STORED_LISTING_IMAGE_BYTES = 20 * 1024;

function getFtypBrand(buffer: Buffer) {
  if (buffer.length < 12) {
    return null;
  }
  if (buffer.toString("ascii", 4, 8) !== "ftyp") {
    return null;
  }
  return buffer.toString("ascii", 8, 12).toLowerCase();
}

function looksLikeAvifContainer(buffer: Buffer) {
  const brand = getFtypBrand(buffer);
  return brand === "avif" || brand === "avis";
}

function looksLikeHeicContainer(buffer: Buffer) {
  const brand = getFtypBrand(buffer);
  return brand !== null && ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(brand);
}

/**
 * Windows sharp builds often detect HEIF but cannot decode HEVC (iPhone HEIC).
 * AVIF is also reported as HEIF (compression av1) and must stay on the sharp path.
 * Convert true HEIC/HEIF payloads to JPEG first so the shared WebP compressor can run.
 */
async function toSharpDecodableBuffer(input: Buffer): Promise<Buffer> {
  const metadata = await sharp(input, { failOn: "none" })
    .metadata()
    .catch(() => null);
  const format = metadata?.format?.toLowerCase() ?? "";
  const compression = String(metadata?.compression ?? "").toLowerCase();

  // Sharp labels AVIF as format "heif" + compression "av1". Do not run heic-convert on it.
  if (format === "avif" || compression === "av1" || looksLikeAvifContainer(input)) {
    return input;
  }

  const maybeHeic =
    format === "heic" ||
    format === "heif" ||
    compression.includes("hevc") ||
    (!metadata && looksLikeHeicContainer(input));

  if (!maybeHeic) {
    return input;
  }

  // Prefer sharp whenever this build can decode the payload (some HEIF variants work).
  try {
    await sharp(input, { failOn: "none" }).rotate().resize(8, 8, { fit: "inside" }).raw().toBuffer();
    return input;
  } catch {
    // Fall through to heic-convert for iPhone HEVC HEIC.
  }

  try {
    const jpeg = await convert({
      buffer: input,
      format: "JPEG",
      quality: 0.9,
    });
    return Buffer.from(jpeg);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    throw new Error(`Could not read this photo (${detail}). Try JPG, PNG, WEBP, AVIF, or HEIC and upload again.`);
  }
}

async function compressListingImageToBudget(input: Buffer): Promise<Buffer> {
  const decodableInput = await toSharpDecodableBuffer(input);
  let width = 960;
  let smallest: Buffer | null = null;

  while (width >= 240) {
    for (let quality = 70; quality >= 18; quality -= 8) {
      const compressed = await sharp(decodableInput, { failOn: "none" })
        .rotate()
        .resize({
          width,
          height: width,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 6, smartSubsample: true })
        .toBuffer();

      if (!smallest || compressed.length < smallest.length) {
        smallest = compressed;
      }

      if (compressed.length <= MAX_STORED_LISTING_IMAGE_BYTES) {
        return compressed;
      }
    }

    width = Math.floor(width * 0.75);
  }

  const lastResort = await sharp(decodableInput, { failOn: "none" })
    .rotate()
    .resize({
      width: 160,
      height: 160,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 12, effort: 6, smartSubsample: true })
    .toBuffer();

  if (lastResort.length <= MAX_STORED_LISTING_IMAGE_BYTES) {
    return lastResort;
  }

  if (smallest && smallest.length <= MAX_STORED_LISTING_IMAGE_BYTES) {
    return smallest;
  }

  throw new Error(
    `Could not compress an image to ${MAX_STORED_LISTING_IMAGE_BYTES} bytes or less. Try a simpler photo.`,
  );
}

export async function saveListingImage(file: File, listingPublicId: string, sortOrder: number) {
  if (file.size <= 0) {
    return null;
  }

  const slotNumber = Math.max(1, sortOrder + 1);
  const safeListingId = sanitizeDirectoryName(listingPublicId) || "listing";
  const finalName = `${slotNumber}-${crypto.randomUUID()}.webp`;
  const relativeDir = path.join(LISTING_IMAGES_RELATIVE_ROOT, safeListingId);
  const absoluteDir = path.join(PUBLIC_ROOT_DIR, relativeDir);
  const absoluteFilePath = path.join(absoluteDir, finalName);

  await fs.mkdir(absoluteDir, { recursive: true });
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  if (fileBuffer.length === 0) {
    return null;
  }

  const compressedBuffer = await compressListingImageToBudget(fileBuffer);
  await fs.writeFile(absoluteFilePath, compressedBuffer);

  return `/${relativeDir.replace(/\\/g, "/")}/${finalName}`;
}

export async function archiveListingImagesForDeletion(listingPublicId: string, images: ListingImageArchiveInput[]) {
  if (images.length === 0) {
    return [];
  }

  const safeListingId = sanitizeDirectoryName(listingPublicId) || "listing";
  const archiveBatchId = crypto.randomUUID();
  const relativeArchiveDir = path.join(DELETED_LISTING_IMAGES_RELATIVE_ROOT, safeListingId, archiveBatchId);
  const absoluteArchiveDir = path.join(PUBLIC_ROOT_DIR, relativeArchiveDir);

  await fs.mkdir(absoluteArchiveDir, { recursive: true });

  const archived: ArchivedListingImage[] = [];
  const copiedArchivePaths: string[] = [];

  try {
    for (const image of images) {
      const sourceAbsolutePath = resolvePublicFilePath(image.imageUrl, LISTING_IMAGES_ABSOLUTE_ROOT);
      const sourceExtension = path.extname(sourceAbsolutePath).toLowerCase() || ".jpg";
      const slotNumber = Math.max(1, image.sortOrder + 1);
      const destinationFilename = `${slotNumber}-${crypto.randomUUID()}${sourceExtension}`;
      const destinationAbsolutePath = path.join(absoluteArchiveDir, destinationFilename);

      if (!isPathInsideDirectory(destinationAbsolutePath, DELETED_LISTING_IMAGES_ABSOLUTE_ROOT)) {
        throw new Error("Archive path is outside deleted listing image directory");
      }

      await fs.copyFile(sourceAbsolutePath, destinationAbsolutePath);
      copiedArchivePaths.push(destinationAbsolutePath);

      archived.push({
        originalImageUrl: image.imageUrl,
        archivedImageUrl: toPublicUrl(destinationAbsolutePath),
        sortOrder: image.sortOrder,
        mimeType: image.mimeType,
        fileSizeBytes: image.fileSizeBytes,
      });
    }
  } catch (error) {
    await Promise.allSettled(copiedArchivePaths.map((entry) => fs.unlink(entry)));
    throw error;
  }

  return archived.sort((a, b) => a.sortOrder - b.sortOrder);
}

async function removeImagesByPublicUrl(imageUrls: string[], expectedAbsoluteRoot: string) {
  if (imageUrls.length === 0) {
    return;
  }

  const uniqueImageUrls = Array.from(
    new Set(imageUrls.map((entry) => normalizePublicUrl(entry)).filter((entry) => entry.length > 0)),
  );

  for (const imageUrl of uniqueImageUrls) {
    let absolutePath: string;
    try {
      absolutePath = resolvePublicFilePath(imageUrl, expectedAbsoluteRoot);
    } catch {
      continue;
    }

    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      if (!(error instanceof Error && "code" in error && (error as { code?: unknown }).code === "ENOENT")) {
        throw error;
      }
    }
  }
}

export async function removeListingImages(imageUrls: string[]) {
  await removeImagesByPublicUrl(imageUrls, LISTING_IMAGES_ABSOLUTE_ROOT);
}

export async function removeDeletedListingArchiveImages(imageUrls: string[]) {
  await removeImagesByPublicUrl(imageUrls, DELETED_LISTING_IMAGES_ABSOLUTE_ROOT);
}
