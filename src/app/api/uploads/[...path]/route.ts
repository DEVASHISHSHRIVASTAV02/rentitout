import { promises as fs } from "fs";
import path from "path";

const ALLOWED_UPLOAD_ROOTS = new Set(["listing-images", "deleted-listing-images"]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveAppRootDir() {
  const fromEnv = process.env.APP_ROOT?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }
  return path.resolve(process.cwd());
}

const UPLOADS_ABSOLUTE_ROOT = path.join(resolveAppRootDir(), "public", "uploads");

function isPathInsideDirectory(targetPath: string, directoryPath: string) {
  const relativePath = path.relative(directoryPath, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function resolveUploadAbsolutePath(pathSegments: string[]) {
  if (pathSegments.length < 2) {
    return null;
  }

  const normalizedSegments = pathSegments
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (normalizedSegments.length < 2) {
    return null;
  }

  const rootFolder = normalizedSegments[0];
  if (!rootFolder || !ALLOWED_UPLOAD_ROOTS.has(rootFolder)) {
    return null;
  }

  for (const segment of normalizedSegments) {
    if (segment === "." || segment === ".." || segment.includes("\0")) {
      return null;
    }
  }

  const absolutePath = path.resolve(UPLOADS_ABSOLUTE_ROOT, path.join(...normalizedSegments));
  if (!isPathInsideDirectory(absolutePath, UPLOADS_ABSOLUTE_ROOT)) {
    return null;
  }

  return absolutePath;
}

function getContentTypeFromPath(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

async function readUploadFile(pathSegments: string[]) {
  const absolutePath = resolveUploadAbsolutePath(pathSegments);
  if (!absolutePath) {
    return null;
  }

  let stats;
  try {
    stats = await fs.stat(absolutePath);
  } catch {
    return null;
  }

  if (!stats.isFile()) {
    return null;
  }

  const fileBuffer = await fs.readFile(absolutePath);
  return {
    fileBuffer,
    contentType: getContentTypeFromPath(absolutePath),
    lastModified: stats.mtime.toUTCString(),
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await params;
  const file = await readUploadFile(pathSegments);
  if (!file) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  return new Response(file.fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Last-Modified": file.lastModified,
    },
  });
}

export async function HEAD(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await params;
  const file = await readUploadFile(pathSegments);
  if (!file) {
    return new Response(null, { status: 404 });
  }

  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Last-Modified": file.lastModified,
    },
  });
}
