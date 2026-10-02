import crypto from "node:crypto";
import http from "node:http";
import zlib from "node:zlib";

const PORT = Number(process.env.PORT || 3000);
const ORIGIN_PORT = Number(process.env.ORIGIN_PORT || 3002);
const HTML_TTL_MS = Number(process.env.PUBLIC_CACHE_TTL_MS || 120_000);
const MEDIA_TTL_MS = Number(process.env.PUBLIC_CACHE_MEDIA_TTL_MS || 600_000);
const STATIC_TTL_MS = Number(process.env.PUBLIC_CACHE_STATIC_TTL_MS || 86_400_000);
const MAX_ENTRIES = Number(process.env.PUBLIC_CACHE_MAX_ENTRIES || 500);
const MAX_BYTES = Number(process.env.PUBLIC_CACHE_MAX_BYTES || 128 * 1024 * 1024);
const MAX_BODY_BYTES = Number(process.env.PUBLIC_CACHE_MAX_BODY_BYTES || 4_000_000);

const BLOCKED_PREFIXES = ["/auth", "/dashboard", "/my-account", "/list-your-appliance", "/api/contact-gate"];
const HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

const cache = new Map();
let totalBytes = 0;

function isMobileUserAgent(userAgent) {
  if (!userAgent) {
    return false;
  }
  const normalized = String(userAgent).toLowerCase();
  return /android|iphone|ipod|blackberry|iemobile|opera mini|mobile/.test(normalized) && !normalized.includes("ipad");
}

function requestUrl(req) {
  return new URL(req.url || "/", "http://127.0.0.1");
}

function isBlockedPath(pathname) {
  return BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicApi(pathname) {
  return pathname.startsWith("/api/listings/") || pathname.startsWith("/api/uploads/");
}

function isImmutableAsset(pathname) {
  return pathname.startsWith("/_next/static/") || pathname === "/favicon.ico";
}

function hasSessionCookie(cookieHeader) {
  return String(cookieHeader || "").toLowerCase().includes("rentitout_session=");
}

function canCacheRequest(req) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return false;
  }
  const url = requestUrl(req);
  if (isImmutableAsset(url.pathname)) {
    return true;
  }
  if (hasSessionCookie(req.headers.cookie)) {
    return false;
  }
  if (isBlockedPath(url.pathname)) {
    return false;
  }
  if (url.pathname.startsWith("/api/") && !isPublicApi(url.pathname)) {
    return false;
  }
  if (url.searchParams.has("message") || url.searchParams.has("error")) {
    return false;
  }
  return true;
}

function isSharedAsset(pathname) {
  return (
    isImmutableAsset(pathname) ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/api/uploads/") ||
    pathname.startsWith("/api/listings/")
  );
}

function cacheKey(req) {
  const url = requestUrl(req);
  if (isSharedAsset(url.pathname)) {
    return `asset|${url.pathname}${url.search}`;
  }
  const stateTree = req.headers["next-router-state-tree"];
  const stateKey = stateTree ? crypto.createHash("sha1").update(String(stateTree)).digest("hex") : "";
  return [
    "doc",
    url.pathname + url.search,
    isMobileUserAgent(req.headers["user-agent"]) ? "mobile" : "desktop",
    req.headers.rsc || "",
    req.headers["next-router-prefetch"] || "",
    req.headers["next-router-segment-prefetch"] || "",
    stateKey,
  ].join("|");
}

function ttlFor(pathname, contentType) {
  if (isImmutableAsset(pathname)) {
    return STATIC_TTL_MS;
  }
  if (
    contentType.startsWith("image/") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/api/uploads/") ||
    pathname.startsWith("/api/listings/")
  ) {
    return MEDIA_TTL_MS;
  }
  return HTML_TTL_MS;
}

function shouldCompress(contentType) {
  return /text\/|javascript|json|xml|svg/.test(contentType);
}

function entrySize(entry) {
  return entry.rawBody.length + (entry.gzipBody?.length || 0) + (entry.brBody?.length || 0);
}

function readCache(key) {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    totalBytes -= entrySize(entry);
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

function writeCache(key, entry) {
  const previous = cache.get(key);
  if (previous) {
    totalBytes -= entrySize(previous);
    cache.delete(key);
  }
  const size = entrySize(entry);
  cache.set(key, entry);
  totalBytes += size;
  while (cache.size > MAX_ENTRIES || totalBytes > MAX_BYTES) {
    const oldest = cache.keys().next().value;
    if (!oldest) {
      break;
    }
    const evicted = cache.get(oldest);
    totalBytes -= entrySize(evicted);
    cache.delete(oldest);
  }
}

function encodingChoice(req) {
  const accept = String(req.headers["accept-encoding"] || "").toLowerCase();
  if (accept.includes("br")) {
    return "br";
  }
  if (accept.includes("gzip")) {
    return "gzip";
  }
  return "identity";
}

function sendCached(req, res, entry) {
  const choice = entry.compressible ? encodingChoice(req) : "identity";
  const body = choice === "br" ? entry.brBody : choice === "gzip" ? entry.gzipBody : entry.rawBody;
  const headers = entry.headers.map(([name, value]) => [name, value]);
  if (choice === "br") {
    headers.push(["Content-Encoding", "br"]);
  } else if (choice === "gzip") {
    headers.push(["Content-Encoding", "gzip"]);
  }
  headers.push(["Content-Length", String(body.length)]);
  headers.push(["X-Public-Cache", "HIT"]);
  res.writeHead(entry.statusCode, headers);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.end(body);
}

function cacheControlFor(pathname, contentType) {
  if (isImmutableAsset(pathname)) {
    return "public, max-age=31536000, immutable";
  }
  if (contentType.startsWith("image/") || pathname.startsWith("/api/uploads/") || pathname.startsWith("/_next/image")) {
    return "public, max-age=600";
  }
  if (pathname.startsWith("/api/listings/")) {
    return "public, max-age=120";
  }
  return "public, max-age=0, s-maxage=120, stale-while-revalidate=60";
}

function forward(req, res) {
  const originReq = http.request(
    {
      hostname: "127.0.0.1",
      port: ORIGIN_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, "accept-encoding": "gzip" },
    },
    (originRes) => {
      const status = originRes.statusCode || 502;
      const chunks = [];
      let size = 0;
      let tooBig = false;

      originRes.on("data", (chunk) => {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) {
          tooBig = true;
          return;
        }
        chunks.push(chunk);
      });

      originRes.on("error", () => {
        if (!res.headersSent) {
          res.writeHead(502, { "content-type": "text/plain; charset=utf-8", "X-Public-Cache": "BYPASS" });
        }
        res.end("origin unavailable");
      });

      originRes.on("end", () => {
        if (res.headersSent) {
          return;
        }
        if (tooBig) {
          res.writeHead(502, { "content-type": "text/plain; charset=utf-8", "X-Public-Cache": "BYPASS" });
          res.end("response too large");
          return;
        }

        const url = requestUrl(req);
        const encoded = Buffer.concat(chunks);
        const isGzip = String(originRes.headers["content-encoding"] || "").toLowerCase().includes("gzip");
        const rawBody = isGzip ? zlib.gunzipSync(encoded) : encoded;
        const contentType = String(originRes.headers["content-type"] || "");
        const setCookie = originRes.headers["set-cookie"];
        const cacheable = canCacheRequest(req);
        const compressible = shouldCompress(contentType);
        const willStore = cacheable && req.method === "GET" && status === 200 && !setCookie && rawBody.length > 0;
        const gzipBody = compressible ? (isGzip ? encoded : zlib.gzipSync(rawBody)) : null;
        const brBody = compressible
          ? zlib.brotliCompressSync(rawBody, {
              params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 },
            })
          : null;

        const outHeaders = [];
        for (const [name, value] of Object.entries(originRes.headers)) {
          if (value == null || HOP_HEADERS.has(name.toLowerCase())) {
            continue;
          }
          const lowered = name.toLowerCase();
          if (lowered === "content-length" || lowered === "content-encoding" || lowered === "cache-control") {
            continue;
          }
          if (Array.isArray(value)) {
            for (const item of value) {
              outHeaders.push([name, String(item)]);
            }
          } else {
            outHeaders.push([name, String(value)]);
          }
        }

        if (willStore) {
          outHeaders.push(["Cache-Control", cacheControlFor(url.pathname, contentType)]);
          if (contentType.includes("text/html") || contentType.includes("text/x-component")) {
            outHeaders.push(["CDN-Cache-Control", "public, s-maxage=120, stale-while-revalidate=60"]);
          }
          if (compressible) {
            outHeaders.push(["Vary", "Accept-Encoding"]);
          }
          writeCache(cacheKey(req), {
            expiresAt: Date.now() + ttlFor(url.pathname, contentType),
            statusCode: status,
            headers: outHeaders.map(([name, value]) => [name, value]),
            compressible,
            rawBody,
            gzipBody,
            brBody,
          });
        } else {
          const cacheControl = originRes.headers["cache-control"];
          if (cacheControl) {
            outHeaders.push(["Cache-Control", String(Array.isArray(cacheControl) ? cacheControl[0] : cacheControl)]);
          }
        }

        const choice = willStore && compressible ? encodingChoice(req) : "identity";
        const body = choice === "br" ? brBody : choice === "gzip" ? gzipBody : rawBody;
        if (choice === "br") {
          outHeaders.push(["Content-Encoding", "br"]);
        } else if (choice === "gzip") {
          outHeaders.push(["Content-Encoding", "gzip"]);
        }
        outHeaders.push(["Content-Length", String(body.length)]);
        outHeaders.push(["X-Public-Cache", willStore ? "MISS" : "BYPASS"]);
        res.writeHead(status, outHeaders);
        if (req.method === "HEAD") {
          res.end();
          return;
        }
        res.end(body);
      });
    },
  );

  originReq.on("error", () => {
    if (res.headersSent) {
      res.end();
      return;
    }
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8", "X-Public-Cache": "BYPASS" });
    res.end("origin unavailable");
  });

  req.pipe(originReq);
}

const server = http.createServer((req, res) => {
  if (!canCacheRequest(req)) {
    forward(req, res);
    return;
  }

  const hit = readCache(cacheKey(req));
  if (hit) {
    sendCached(req, res, hit);
    return;
  }

  forward(req, res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`public cache listening on 127.0.0.1:${PORT} -> 127.0.0.1:${ORIGIN_PORT}`);
});
