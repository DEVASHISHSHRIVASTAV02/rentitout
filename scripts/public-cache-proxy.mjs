import crypto from "node:crypto";
import http from "node:http";
import zlib from "node:zlib";

const PORT = Number(process.env.PORT || 3000);
const ORIGIN_PORT = Number(process.env.ORIGIN_PORT || 3002);
const TTL_MS = Number(process.env.PUBLIC_CACHE_TTL_MS || 120_000);
const MAX_ENTRIES = Number(process.env.PUBLIC_CACHE_MAX_ENTRIES || 200);
const MAX_BODY_BYTES = Number(process.env.PUBLIC_CACHE_MAX_BODY_BYTES || 1_500_000);

const PRIVATE_PREFIXES = ["/api", "/auth", "/dashboard", "/my-account", "/list-your-appliance"];
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

function isMobileUserAgent(userAgent) {
  if (!userAgent) {
    return false;
  }
  const normalized = String(userAgent).toLowerCase();
  return /android|iphone|ipod|blackberry|iemobile|opera mini|mobile/.test(normalized) && !normalized.includes("ipad");
}

function isPrivatePath(pathname) {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function hasSessionCookie(cookieHeader) {
  return String(cookieHeader || "").toLowerCase().includes("rentitout_session=");
}

function requestUrl(req) {
  return new URL(req.url || "/", "http://127.0.0.1");
}

function canCacheRequest(req) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return false;
  }
  if (hasSessionCookie(req.headers.cookie)) {
    return false;
  }
  const url = requestUrl(req);
  if (isPrivatePath(url.pathname)) {
    return false;
  }
  if (url.searchParams.has("message") || url.searchParams.has("error")) {
    return false;
  }
  return true;
}

function cacheKey(req) {
  const url = requestUrl(req);
  const stateTree = req.headers["next-router-state-tree"];
  const stateKey = stateTree
    ? crypto.createHash("sha1").update(String(stateTree)).digest("hex")
    : "";
  return [
    url.pathname + url.search,
    isMobileUserAgent(req.headers["user-agent"]) ? "mobile" : "desktop",
    req.headers.rsc || "",
    req.headers["next-router-prefetch"] || "",
    req.headers["next-router-segment-prefetch"] || "",
    stateKey,
  ].join("|");
}

function readCache(key) {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

function writeCache(key, entry) {
  cache.delete(key);
  cache.set(key, entry);
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

function acceptsGzip(req) {
  return String(req.headers["accept-encoding"] || "").toLowerCase().includes("gzip");
}

function sendCached(req, res, entry) {
  const gzipOk = acceptsGzip(req);
  const body = gzipOk ? entry.gzipBody : zlib.gunzipSync(entry.gzipBody);
  const headers = entry.headers.filter(([name]) => {
    const lowered = name.toLowerCase();
    return lowered !== "content-length" && lowered !== "content-encoding";
  });
  if (gzipOk) {
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

function forward(req, res, cacheable, key) {
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
      const setCookie = originRes.headers["set-cookie"];
      const contentType = String(originRes.headers["content-type"] || "");
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
        if (res.headersSent) {
          res.end();
          return;
        }
        res.writeHead(502, { "content-type": "text/plain; charset=utf-8", "X-Public-Cache": "BYPASS" });
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

        const encoded = Buffer.concat(chunks);
        const isGzip = String(originRes.headers["content-encoding"] || "").toLowerCase().includes("gzip");
        const gzipBody = isGzip ? encoded : zlib.gzipSync(encoded);
        const willStore =
          cacheable &&
          req.method === "GET" &&
          status === 200 &&
          !setCookie &&
          contentType.includes("text/html");

        const outHeaders = [];
        for (const [name, value] of Object.entries(originRes.headers)) {
          if (value == null || HOP_HEADERS.has(name.toLowerCase())) {
            continue;
          }
          const lowered = name.toLowerCase();
          if (lowered === "content-length" || lowered === "content-encoding") {
            continue;
          }
          if (willStore && lowered === "cache-control") {
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
          outHeaders.push(["Cache-Control", "public, max-age=0, s-maxage=120, stale-while-revalidate=60"]);
          outHeaders.push(["CDN-Cache-Control", "public, s-maxage=120, stale-while-revalidate=60"]);
          writeCache(key, {
            expiresAt: Date.now() + TTL_MS,
            statusCode: status,
            headers: outHeaders.map(([name, value]) => [name, value]),
            gzipBody,
          });
        }

        const gzipOk = acceptsGzip(req);
        const body = gzipOk ? gzipBody : isGzip ? zlib.gunzipSync(encoded) : encoded;
        if (gzipOk) {
          outHeaders.push(["Content-Encoding", "gzip"]);
        }
        outHeaders.push(["Content-Length", String(body.length)]);
        outHeaders.push(["X-Public-Cache", willStore ? "MISS" : cacheable ? "BYPASS" : "BYPASS"]);
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
    forward(req, res, false, "");
    return;
  }

  const key = cacheKey(req);
  const hit = readCache(key);
  if (hit) {
    sendCached(req, res, hit);
    return;
  }

  forward(req, res, true, key);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`public cache listening on 127.0.0.1:${PORT} -> 127.0.0.1:${ORIGIN_PORT}`);
});
