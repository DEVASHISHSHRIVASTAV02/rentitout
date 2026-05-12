import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";
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
const MAX_UPLOAD_IMAGE_DIMENSION = 1920;
const MAX_UPLOAD_IMAGE_PIXELS = 32_000_000;
const JPEG_QUALITY = 78;
const PNG_QUALITY = 82;
const WEBP_QUALITY = 76;
type OutputImageFormat = "jpeg" | "png" | "webp";

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

function getNormalizedInputExtension(fileName: string) {
  const extension = path.extname(fileName || "listing-image");
  return extension ? extension.toLowerCase() : "";
}

function resolveOutputImageFormat(file: File): OutputImageFormat {
  const fileType = file.type.trim().toLowerCase();
  switch (fileType) {
    case "image/jpg":
    case "image/jpeg":
      return "jpeg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      break;
  }

  const extension = getNormalizedInputExtension(file.name);
  if (extension === ".png") {
    return "png";
  }
  if (extension === ".webp") {
    return "webp";
  }
  return "jpeg";
}

function getOutputImageExtension(format: OutputImageFormat) {
  if (format === "png") {
    return ".png";
  }
  if (format === "webp") {
    return ".webp";
  }
  return ".jpg";
}

async function compressListingImageBuffer(inputBuffer: Buffer, outputFormat: OutputImageFormat) {
  let pipeline = sharp(inputBuffer, { limitInputPixels: MAX_UPLOAD_IMAGE_PIXELS })
    .rotate()
    .resize({
      width: MAX_UPLOAD_IMAGE_DIMENSION,
      height: MAX_UPLOAD_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });

  switch (outputFormat) {
    case "jpeg":
      pipeline = pipeline.jpeg({
        quality: JPEG_QUALITY,
        mozjpeg: true,
        chromaSubsampling: "4:2:0",
      });
      break;
    case "png":
      pipeline = pipeline.png({
        quality: PNG_QUALITY,
        compressionLevel: 9,
        effort: 8,
        palette: true,
      });
      break;
    case "webp":
      pipeline = pipeline.webp({
        quality: WEBP_QUALITY,
        effort: 6,
      });
      break;
    default:
      break;
  }

  const compressedBuffer = await pipeline.toBuffer();
  if (compressedBuffer.length === 0) {
    throw new Error("Compressed image output is empty");
  }
  return compressedBuffer;
}

export async function saveListingImage(file: File, listingPublicId: string, sortOrder: number) {
  if (file.size <= 0) {
    return null;
  }

  const outputFormat = resolveOutputImageFormat(file);
  const extension = getOutputImageExtension(outputFormat);
  const slotNumber = Math.max(1, sortOrder + 1);
  const safeListingId = sanitizeDirectoryName(listingPublicId) || "listing";
  const finalName = `${slotNumber}-${crypto.randomUUID()}${extension}`;
  const relativeDir = path.join(LISTING_IMAGES_RELATIVE_ROOT, safeListingId);
  const absoluteDir = path.join(PUBLIC_ROOT_DIR, relativeDir);
  const absoluteFilePath = path.join(absoluteDir, finalName);

  await fs.mkdir(absoluteDir, { recursive: true });
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await compressListingImageBuffer(inputBuffer, outputFormat);
  await fs.writeFile(absoluteFilePath, outputBuffer);

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
