import { createReadStream, existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..", "..");
const distDir = path.join(workspaceRoot, "fenghuang-unified", "dist");
const host = process.env.FENGHUANG_LOCAL_HOST ?? "0.0.0.0";
const port = Number(process.env.FENGHUANG_LOCAL_PORT ?? 5182);
const apiTarget = new URL(process.env.FENGHUANG_API_TARGET ?? "http://127.0.0.1:3000");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

const SPA_ROUTES = ["/home", "/login", "/register", "/novels", "/writing", "/showcase"];

function sendEmpty(res, statusCode, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end();
}

function sendText(res, statusCode, body, headers = {}) {
  const content = Buffer.from(body, "utf8");
  res.writeHead(statusCode, {
    "Content-Length": content.length,
    "Content-Type": "text/plain; charset=utf-8",
    ...headers,
  });

  res.end(content);
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

function resolveDistFile(requestPath) {
  const relativePath = requestPath.startsWith("/home/")
    ? requestPath.slice("/home/".length)
    : requestPath.slice(1);
  const safePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  return path.join(distDir, safePath);
}

function tryResolveStaticFile(requestPath) {
  const candidate = resolveDistFile(requestPath);
  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }

  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    const indexCandidate = path.join(candidate, "index.html");
    if (existsSync(indexCandidate) && statSync(indexCandidate).isFile()) {
      return indexCandidate;
    }
  }

  return null;
}

function isSpaRoute(requestPath) {
  return SPA_ROUTES.some((route) => requestPath === route || requestPath.startsWith(`${route}/`));
}

async function sendIndex(res, method) {
  const indexPath = path.join(distDir, "index.html");
  const html = await readFile(indexPath);

  res.writeHead(200, {
    "Content-Length": html.length,
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache",
  });

  if (method === "HEAD") {
    res.end();
    return;
  }

  res.end(html);
}

function sendFile(res, filePath, method) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    sendText(res, 404, "Not Found");
    return;
  }

  const stat = statSync(filePath);
  res.writeHead(200, {
    "Content-Length": stat.size,
    "Content-Type": getMimeType(filePath),
    "Cache-Control": "no-cache",
  });

  if (method === "HEAD") {
    res.end();
    return;
  }

  createReadStream(filePath).pipe(res);
}

function proxyApi(req, res) {
  const transport = apiTarget.protocol === "https:" ? https : http;
  const upstream = transport.request(
    {
      protocol: apiTarget.protocol,
      hostname: apiTarget.hostname,
      port: apiTarget.port,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        host: apiTarget.host,
      },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    }
  );

  upstream.on("error", (error) => {
    sendText(res, 502, `API proxy failed: ${error.message}`);
  });

  req.pipe(upstream);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
  const requestPath = decodeURIComponent(url.pathname);
  const method = req.method ?? "GET";

  try {
    if (requestPath === "/") {
      sendEmpty(res, 302, { Location: "/home" });
      return;
    }

    if (requestPath.startsWith("/api/")) {
      proxyApi(req, res);
      return;
    }

    const staticFile = tryResolveStaticFile(requestPath);
    if (staticFile) {
      sendFile(res, staticFile, method);
      return;
    }

    if (isSpaRoute(requestPath)) {
      await sendIndex(res, method);
      return;
    }

    sendText(res, 404, "Not Found");
  } catch (error) {
    sendText(res, 500, error instanceof Error ? error.message : "Internal Server Error");
  }
});

server.listen(port, host, () => {
  console.log(`Fenghuang local server listening on http://${host}:${port}`);
  console.log(`Serving dist from ${distDir}`);
  console.log(`Proxying /api to ${apiTarget.origin}`);
});
