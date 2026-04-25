import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";

const PUBLIC_ROOT_DIR = path.join(process.cwd(), "public");
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

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9.\-_]/g, "-");
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

function getFileExtension(file: File) {
  const fileName = file.name || "listing-image";
  const extension = path.extname(fileName);
  if (extension) {
    return extension.toLowerCase();
  }

  switch (file.type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return ".jpg";
  }
}

export async function saveListingImage(file: File, userId: string) {
  if (file.size <= 0) {
    return null;
  }

  const extension = getFileExtension(file);
  const basename = sanitizeFilename(path.basename(file.name || "listing-image", path.extname(file.name || "")));
  const finalName = `${crypto.randomUUID()}-${basename || "image"}${extension}`;
  const relativeDir = path.join(LISTING_IMAGES_RELATIVE_ROOT, userId);
  const absoluteDir = path.join(PUBLIC_ROOT_DIR, relativeDir);
  const absoluteFilePath = path.join(absoluteDir, finalName);

  await fs.mkdir(absoluteDir, { recursive: true });
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(absoluteFilePath, Buffer.from(arrayBuffer));

  return `/${relativeDir.replace(/\\/g, "/")}/${finalName}`;
}

export async function archiveListingImagesForDeletion(listingPublicId: string, images: ListingImageArchiveInput[]) {
  if (images.length === 0) {
    return [];
  }

  const safeListingId = sanitizeFilename(listingPublicId) || "listing";
  const archiveBatchId = crypto.randomUUID();
  const relativeArchiveDir = path.join(DELETED_LISTING_IMAGES_RELATIVE_ROOT, safeListingId, archiveBatchId);
  const absoluteArchiveDir = path.join(PUBLIC_ROOT_DIR, relativeArchiveDir);

  await fs.mkdir(absoluteArchiveDir, { recursive: true });

  const archived: ArchivedListingImage[] = [];
  const copiedArchivePaths: string[] = [];

  try {
    for (const image of images) {
      const sourceAbsolutePath = resolvePublicFilePath(image.imageUrl, LISTING_IMAGES_ABSOLUTE_ROOT);
      const sourceFilename = sanitizeFilename(path.basename(sourceAbsolutePath)) || `${crypto.randomUUID()}.jpg`;
      const destinationFilename = `${String(image.sortOrder).padStart(2, "0")}-${sourceFilename}`;
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
