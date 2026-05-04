import fs from "fs/promises";
import path from "path";
import process from "process";

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_APP_URL",
  "DATABASE_URL",
  "AUTH_OTP_SECRET",
  "NEXT_PUBLIC_RECAPTCHA_SITE_KEY",
  "RECAPTCHA_SECRET_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
];

const OPTIONAL_ENV_VARS = ["LISTING_PROOF_REVIEW_EMAIL"];
const MIN_NODE_MAJOR = 24;

function parseEnvFile(content) {
  const parsed = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

async function loadEnvFromFiles() {
  const candidateFiles = [".env.local", ".env.production", ".env"];
  const merged = {};

  for (const relativeFile of candidateFiles) {
    const filePath = path.join(process.cwd(), relativeFile);
    try {
      const content = await fs.readFile(filePath, "utf8");
      Object.assign(merged, parseEnvFile(content));
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }
  }

  return merged;
}

function readNodeMajorVersion() {
  const majorRaw = process.versions.node.split(".")[0];
  const major = Number.parseInt(majorRaw, 10);
  return Number.isNaN(major) ? null : major;
}

function normalizeUrl(input) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

async function verifyWritableDirectory(targetDirectory) {
  await fs.mkdir(targetDirectory, { recursive: true });

  const probeFile = path.join(targetDirectory, `.write-test-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
  await fs.writeFile(probeFile, "ok", "utf8");
  await fs.unlink(probeFile);
}

function printStatus(ok, message) {
  const marker = ok ? "PASS" : "FAIL";
  console.log(`[${marker}] ${message}`);
}

async function main() {
  console.log("RentItOut production preflight");
  console.log(`Working directory: ${process.cwd()}`);

  let hasErrors = false;
  const fileEnv = await loadEnvFromFiles();
  const env = { ...fileEnv, ...process.env };

  const nodeMajor = readNodeMajorVersion();
  const nodeOk = nodeMajor !== null && nodeMajor >= MIN_NODE_MAJOR;
  printStatus(nodeOk, `Node.js major version >= ${MIN_NODE_MAJOR} (found: ${process.versions.node})`);
  if (!nodeOk) {
    hasErrors = true;
  }

  for (const key of REQUIRED_ENV_VARS) {
    const value = (env[key] ?? "").trim();
    const ok = value.length > 0;
    printStatus(ok, `Environment variable ${key} is set`);
    if (!ok) {
      hasErrors = true;
    }
  }

  for (const key of OPTIONAL_ENV_VARS) {
    const value = (env[key] ?? "").trim();
    printStatus(true, `Optional environment variable ${key} ${value ? "is set" : "is not set"}`);
  }

  const appUrlValue = (env.NEXT_PUBLIC_APP_URL ?? "").trim();
  const appUrl = normalizeUrl(appUrlValue);
  const appUrlOk = Boolean(appUrl);
  printStatus(appUrlOk, "NEXT_PUBLIC_APP_URL is a valid URL");
  if (!appUrlOk) {
    hasErrors = true;
  } else {
    const httpsOk = appUrl.protocol === "https:";
    printStatus(
      httpsOk,
      `NEXT_PUBLIC_APP_URL uses https in production (found protocol: ${appUrl.protocol})`,
    );
    if (!httpsOk) {
      hasErrors = true;
    }
  }

  const writableDirectories = [
    path.join(process.cwd(), "public", "uploads", "listing-images"),
    path.join(process.cwd(), "public", "uploads", "deleted-listing-images"),
  ];

  for (const directoryPath of writableDirectories) {
    const relativeDirectory = path.relative(process.cwd(), directoryPath).replace(/\\/g, "/");
    try {
      await verifyWritableDirectory(directoryPath);
      printStatus(true, `${relativeDirectory} exists and is writable`);
    } catch (error) {
      printStatus(false, `${relativeDirectory} writable check failed: ${String(error)}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error("\nPreflight failed. Fix the failed checks and run again.");
    process.exit(1);
  }

  console.log("\nPreflight passed.");
}

main().catch((error) => {
  console.error("Preflight crashed:", error);
  process.exit(1);
});
