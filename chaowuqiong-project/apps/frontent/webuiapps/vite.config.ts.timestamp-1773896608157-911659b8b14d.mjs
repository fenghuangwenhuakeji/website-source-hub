// vite.config.ts
import { loadEnv } from "file:///D:/AIcreateEngine/pythonIDE/snake/Agent%E6%B5%8F%E8%A7%88%E5%99%A8%E6%A1%8C%E9%9D%A2/OpenRoom-main/OpenRoom-main/node_modules/vite/dist/node/index.js";
import legacy from "file:///D:/AIcreateEngine/pythonIDE/snake/Agent%E6%B5%8F%E8%A7%88%E5%99%A8%E6%A1%8C%E9%9D%A2/OpenRoom-main/OpenRoom-main/node_modules/@vitejs/plugin-legacy/dist/index.mjs";
import react from "file:///D:/AIcreateEngine/pythonIDE/snake/Agent%E6%B5%8F%E8%A7%88%E5%99%A8%E6%A1%8C%E9%9D%A2/OpenRoom-main/OpenRoom-main/node_modules/@vitejs/plugin-react-swc/index.js";
import { resolve } from "path";
import { visualizer } from "file:///D:/AIcreateEngine/pythonIDE/snake/Agent%E6%B5%8F%E8%A7%88%E5%99%A8%E6%A1%8C%E9%9D%A2/OpenRoom-main/OpenRoom-main/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import autoprefixer from "file:///D:/AIcreateEngine/pythonIDE/snake/Agent%E6%B5%8F%E8%A7%88%E5%99%A8%E6%A1%8C%E9%9D%A2/OpenRoom-main/OpenRoom-main/node_modules/autoprefixer/lib/autoprefixer.js";
import { sentryVitePlugin } from "file:///D:/AIcreateEngine/pythonIDE/snake/Agent%E6%B5%8F%E8%A7%88%E5%99%A8%E6%A1%8C%E9%9D%A2/OpenRoom-main/OpenRoom-main/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import * as fs from "fs";
import * as os from "os";
import { join } from "path";

// src/lib/logPlugin.ts
var pad = (n) => String(n).padStart(2, "0");
var pad3 = (n) => String(n).padStart(3, "0");
function generateLogFileName(now = /* @__PURE__ */ new Date()) {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `debug-${date}_${time}.log`;
}
function formatLogLine(body) {
  const d = new Date(body.ts);
  const time = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad3(d.getMilliseconds())}`;
  const argsStr = body.args.map((a) => a !== null && typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ");
  return `${time} [${body.level.toUpperCase()}] [${body.tag}] ${argsStr}`;
}
function createLogMiddleware(logFile, fsModule) {
  const logDir = logFile.split("/").slice(0, -1).join("/");
  return (req, res, _next) => {
    if (req.method !== "POST") {
      res.writeHead(405);
      res.end();
      return;
    }
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const line = formatLogLine(body);
        if (!fsModule.existsSync(logDir)) {
          fsModule.mkdirSync(logDir, { recursive: true });
        }
        fsModule.appendFileSync(logFile, line + "\n", "utf8");
        res.writeHead(204);
        res.end();
      } catch {
        res.writeHead(400);
        res.end();
      }
    });
  };
}

// vite.config.ts
var __vite_injected_original_dirname = "D:\\AIcreateEngine\\pythonIDE\\snake\\Agent\u6D4F\u89C8\u5668\u684C\u9762\\OpenRoom-main\\OpenRoom-main\\apps\\webuiapps";
var LLM_CONFIG_FILE = resolve(os.homedir(), ".openroom", "config.json");
var SESSIONS_DIR = resolve(os.homedir(), ".openroom", "sessions");
var CHARACTERS_FILE = resolve(os.homedir(), ".openroom", "characters.json");
var MODS_FILE = resolve(os.homedir(), ".openroom", "mods.json");
function llmConfigPlugin() {
  return {
    name: "llm-config",
    configureServer(server) {
      server.middlewares.use("/api/llm-config", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        if (req.method === "GET") {
          try {
            if (fs.existsSync(LLM_CONFIG_FILE)) {
              const content = fs.readFileSync(LLM_CONFIG_FILE, "utf-8");
              res.writeHead(200);
              res.end(content);
            } else {
              res.writeHead(200);
              res.end("{}");
            }
          } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }
        if (req.method === "POST") {
          const chunks = [];
          req.on("data", (chunk) => chunks.push(chunk));
          req.on("end", () => {
            try {
              const body = Buffer.concat(chunks).toString();
              JSON.parse(body);
              fs.mkdirSync(resolve(os.homedir(), ".openroom"), { recursive: true });
              fs.writeFileSync(LLM_CONFIG_FILE, body, "utf-8");
              res.writeHead(200);
              res.end(JSON.stringify({ ok: true }));
            } catch (err) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }
        res.writeHead(405);
        res.end(JSON.stringify({ error: "Method not allowed" }));
      });
    }
  };
}
function sessionDataPlugin() {
  return {
    name: "session-data",
    configureServer(server) {
      server.middlewares.use("/api/session-data", (req, res) => {
        var _a;
        res.setHeader("Content-Type", "application/json");
        const url = new URL(req.url || "", "http://localhost");
        const relPath = url.searchParams.get("path") || "";
        const action = url.searchParams.get("action") || "";
        if (!relPath) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing path parameter" }));
          return;
        }
        const safePath = relPath.replace(/[^a-zA-Z0-9_\-./]/g, "_").replace(/\.\./g, "");
        const filePath = join(SESSIONS_DIR, safePath);
        if (action === "list" && req.method === "GET") {
          try {
            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isDirectory()) {
              res.writeHead(200);
              res.end(JSON.stringify({ files: [], not_exists: !fs.existsSync(filePath) }));
              return;
            }
            const entries = fs.readdirSync(filePath, { withFileTypes: true });
            const files = entries.map((e) => ({
              path: safePath === "" || safePath === "/" ? e.name : `${safePath}/${e.name}`,
              type: e.isDirectory() ? 1 : 0,
              size: e.isDirectory() ? 0 : fs.statSync(join(filePath, e.name)).size
            }));
            res.writeHead(200);
            res.end(JSON.stringify({ files, not_exists: false }));
          } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }
        if (req.method === "GET") {
          try {
            if (fs.existsSync(filePath)) {
              const ext = ((_a = filePath.split(".").pop()) == null ? void 0 : _a.toLowerCase()) || "";
              const binaryMimes = {
                png: "image/png",
                jpg: "image/jpeg",
                jpeg: "image/jpeg",
                gif: "image/gif",
                webp: "image/webp",
                svg: "image/svg+xml",
                mp4: "video/mp4",
                webm: "video/webm"
              };
              const mime = binaryMimes[ext];
              if (mime) {
                res.setHeader("Content-Type", mime);
                res.writeHead(200);
                res.end(fs.readFileSync(filePath));
              } else {
                res.writeHead(200);
                res.end(fs.readFileSync(filePath, "utf-8"));
              }
            } else {
              res.writeHead(200);
              res.end("{}");
            }
          } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }
        if (req.method === "POST") {
          const chunks = [];
          req.on("data", (chunk) => chunks.push(chunk));
          req.on("end", () => {
            try {
              const buf = Buffer.concat(chunks);
              const dir = filePath.substring(0, filePath.lastIndexOf("/"));
              fs.mkdirSync(dir, { recursive: true });
              const ct = (req.headers["content-type"] || "").toLowerCase();
              if (ct.startsWith("image/") || ct.startsWith("video/") || ct === "application/octet-stream") {
                fs.writeFileSync(filePath, buf);
              } else {
                fs.writeFileSync(filePath, buf.toString(), "utf-8");
              }
              res.writeHead(200);
              res.end(JSON.stringify({ ok: true }));
            } catch (err) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }
        if (req.method === "DELETE") {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            res.writeHead(200);
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }
        res.writeHead(405);
        res.end(JSON.stringify({ error: "Method not allowed" }));
      });
      server.middlewares.use("/api/session-reset", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        if (req.method !== "DELETE") {
          res.writeHead(405);
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        const url = new URL(req.url || "", "http://localhost");
        const relPath = url.searchParams.get("path") || "";
        if (!relPath) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing path parameter" }));
          return;
        }
        const safePath = relPath.replace(/[^a-zA-Z0-9_\-./]/g, "_").replace(/\.\./g, "");
        const targetDir = join(SESSIONS_DIR, safePath);
        try {
          if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
          }
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    }
  };
}
function logServerPlugin() {
  return {
    name: "log-server",
    configureServer(server) {
      var _a;
      const logDir = join(__vite_injected_original_dirname, "logs");
      const logFile = join(logDir, generateLogFileName());
      const middleware = createLogMiddleware(logFile, fs);
      server.middlewares.use("/api/log", middleware);
      (_a = server.httpServer) == null ? void 0 : _a.once("listening", () => {
        console.log(`
  [DebugLog] Writing to: ${logFile}
`);
      });
    }
  };
}
function llmProxyPlugin() {
  return {
    name: "llm-proxy",
    configureServer(server) {
      server.middlewares.use("/api/llm-proxy", async (req, res) => {
        const targetUrl = req.headers["x-llm-target-url"];
        if (!targetUrl) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing X-LLM-Target-URL header" }));
          return;
        }
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", async () => {
          try {
            const body = Buffer.concat(chunks).toString();
            const headers = {};
            const skipKeys = /* @__PURE__ */ new Set(["host", "connection", "content-length", "x-llm-target-url"]);
            for (const [key, val] of Object.entries(req.headers)) {
              if (typeof val !== "string")
                continue;
              if (skipKeys.has(key))
                continue;
              if (key.startsWith("x-custom-")) {
                headers[key.replace("x-custom-", "")] = val;
              } else {
                headers[key] = val;
              }
            }
            const fetchRes = await fetch(targetUrl, {
              method: req.method || "POST",
              headers,
              body
            });
            res.writeHead(fetchRes.status, {
              "Content-Type": fetchRes.headers.get("Content-Type") || "application/json",
              "Transfer-Encoding": "chunked"
            });
            if (fetchRes.body) {
              const reader = fetchRes.body.getReader();
              const pump = async () => {
                let done = false;
                while (!done) {
                  const result = await reader.read();
                  done = result.done;
                  if (!done)
                    res.write(result.value);
                }
                res.end();
              };
              pump().catch(() => res.end());
            } else {
              const text = await fetchRes.text();
              res.end(text);
            }
          } catch (err) {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
          }
        });
      });
    }
  };
}
function jsonFilePlugin(name, apiPath, filePath) {
  return {
    name,
    configureServer(server) {
      server.middlewares.use(apiPath, (req, res) => {
        res.setHeader("Content-Type", "application/json");
        if (req.method === "GET") {
          try {
            if (fs.existsSync(filePath)) {
              res.writeHead(200);
              res.end(fs.readFileSync(filePath, "utf-8"));
            } else {
              res.writeHead(200);
              res.end("{}");
            }
          } catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }
        if (req.method === "POST") {
          const chunks = [];
          req.on("data", (chunk) => chunks.push(chunk));
          req.on("end", () => {
            try {
              const body = Buffer.concat(chunks).toString();
              JSON.parse(body);
              fs.mkdirSync(resolve(os.homedir(), ".openroom"), { recursive: true });
              fs.writeFileSync(filePath, body, "utf-8");
              res.writeHead(200);
              res.end(JSON.stringify({ ok: true }));
            } catch (err) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }
        res.writeHead(405);
        res.end(JSON.stringify({ error: "Method not allowed" }));
      });
    }
  };
}
var config = ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isProd = env.NODE_ENV === "production";
  const isTest = env.NODE_ENV === "test";
  const isAnalyze = env.ANALYZE === "analyze";
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN;
  const bizProjectName = env.BIZ_PROJECT_NAME || "";
  const getBase = () => {
    if (isProd && env.CDN_PREFIX) {
      return env.CDN_PREFIX + "/" + bizProjectName;
    }
    if ((isTest || isProd) && bizProjectName) {
      return "/" + bizProjectName + "/";
    }
    return "/";
  };
  const skipLegacy = env.VITE_SKIP_LEGACY === "true";
  const plugins = [
    llmConfigPlugin(),
    sessionDataPlugin(),
    logServerPlugin(),
    llmProxyPlugin(),
    jsonFilePlugin("characters", "/api/characters", CHARACTERS_FILE),
    jsonFilePlugin("mods", "/api/mods", MODS_FILE),
    react(),
    ...skipLegacy ? [] : [
      legacy({
        targets: ["defaults", "not ie <= 11", "chrome 80"],
        additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
        renderLegacyChunks: true,
        modernPolyfills: true
      })
    ]
  ];
  if (isAnalyze) {
    plugins.push(
      visualizer({
        gzipSize: true,
        open: true,
        filename: `${env.APP_NAME}-chunk.html`
      })
    );
  }
  if (isProd && sentryAuthToken) {
    plugins.push(
      sentryVitePlugin({
        authToken: sentryAuthToken,
        org: env.SENTRY_ORG || "",
        project: env.SENTRY_PROJECT || "",
        url: env.SENTRY_URL || void 0,
        sourcemaps: {
          filesToDeleteAfterUpload: ["dist/**/*.js.map"]
        }
      })
    );
  }
  return {
    plugins,
    css: {
      postcss: {
        plugins: [autoprefixer({})]
      }
    },
    resolve: {
      alias: {
        "@": resolve(__vite_injected_original_dirname, "./src"),
        "@gui/vibe-container": resolve(__vite_injected_original_dirname, "./src/lib/vibeContainerMock.ts")
      }
    },
    base: getBase(),
    server: {
      host: true,
      port: 3e3
    },
    define: {
      __APP__: JSON.stringify(env.APP_ENVIRONMENT),
      __ROUTER_BASE__: JSON.stringify(bizProjectName ? "/" + bizProjectName : ""),
      __ENV__: JSON.stringify(env.NODE_ENV)
    },
    build: {
      outDir: "dist",
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-lucide": ["lucide-react"],
            "vendor-i18n": ["i18next", "react-i18next"],
            "vendor-framer": ["framer-motion"]
          },
          assetFileNames: (assetInfo) => {
            var _a;
            if ((_a = assetInfo.name) == null ? void 0 : _a.endsWith(".css")) {
              return "assets/styles/[name]-[hash][extname]";
            }
            if (/\.(png|jpe?g|gif|svg)$/.test(assetInfo.name || "")) {
              return "assets/images/[name]-[hash][extname]";
            }
            if (/\.(ttf)$/.test(assetInfo.name || "")) {
              return "assets/fonts/[name]-[hash][extname]";
            }
            return "[name]-[hash][extname]";
          }
        }
      },
      minify: "esbuild",
      chunkSizeWarningLimit: 1500,
      cssTarget: "chrome61",
      sourcemap: isProd,
      manifest: true,
      target: "esnext"
    }
  };
};
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL2xpYi9sb2dQbHVnaW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxBSWNyZWF0ZUVuZ2luZVxcXFxweXRob25JREVcXFxcc25ha2VcXFxcQWdlbnRcdTZENEZcdTg5QzhcdTU2NjhcdTY4NENcdTk3NjJcXFxcT3BlblJvb20tbWFpblxcXFxPcGVuUm9vbS1tYWluXFxcXGFwcHNcXFxcd2VidWlhcHBzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxBSWNyZWF0ZUVuZ2luZVxcXFxweXRob25JREVcXFxcc25ha2VcXFxcQWdlbnRcdTZENEZcdTg5QzhcdTU2NjhcdTY4NENcdTk3NjJcXFxcT3BlblJvb20tbWFpblxcXFxPcGVuUm9vbS1tYWluXFxcXGFwcHNcXFxcd2VidWlhcHBzXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9BSWNyZWF0ZUVuZ2luZS9weXRob25JREUvc25ha2UvQWdlbnQlRTYlQjUlOEYlRTglQTclODglRTUlOTklQTglRTYlQTElOEMlRTklOUQlQTIvT3BlblJvb20tbWFpbi9PcGVuUm9vbS1tYWluL2FwcHMvd2VidWlhcHBzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgVXNlckNvbmZpZ0V4cG9ydCwgQ29uZmlnRW52LCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgdHlwZSB7IFBsdWdpbk9wdGlvbiwgUGx1Z2luIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgbGVnYWN5IGZyb20gJ0B2aXRlanMvcGx1Z2luLWxlZ2FjeSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInO1xuaW1wb3J0IGF1dG9wcmVmaXhlciBmcm9tICdhdXRvcHJlZml4ZXInO1xuaW1wb3J0IHsgc2VudHJ5Vml0ZVBsdWdpbiB9IGZyb20gJ0BzZW50cnkvdml0ZS1wbHVnaW4nO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgb3MgZnJvbSAnb3MnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZ2VuZXJhdGVMb2dGaWxlTmFtZSwgY3JlYXRlTG9nTWlkZGxld2FyZSB9IGZyb20gJy4vc3JjL2xpYi9sb2dQbHVnaW4nO1xuXG5jb25zdCBMTE1fQ09ORklHX0ZJTEUgPSByZXNvbHZlKG9zLmhvbWVkaXIoKSwgJy5vcGVucm9vbScsICdjb25maWcuanNvbicpO1xuY29uc3QgU0VTU0lPTlNfRElSID0gcmVzb2x2ZShvcy5ob21lZGlyKCksICcub3BlbnJvb20nLCAnc2Vzc2lvbnMnKTtcbmNvbnN0IENIQVJBQ1RFUlNfRklMRSA9IHJlc29sdmUob3MuaG9tZWRpcigpLCAnLm9wZW5yb29tJywgJ2NoYXJhY3RlcnMuanNvbicpO1xuY29uc3QgTU9EU19GSUxFID0gcmVzb2x2ZShvcy5ob21lZGlyKCksICcub3BlbnJvb20nLCAnbW9kcy5qc29uJyk7XG5cbi8qKiBMTE0gY29uZmlnIHBlcnNpc3RlbmNlIHBsdWdpbiBcdTIwMTQgcmVhZHMvd3JpdGVzIGNvbmZpZyB0byB+Ly5vcGVucm9vbS9jb25maWcuanNvbiAqL1xuZnVuY3Rpb24gbGxtQ29uZmlnUGx1Z2luKCk6IFBsdWdpbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2xsbS1jb25maWcnLFxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvbGxtLWNvbmZpZycsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuXG4gICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnR0VUJykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhMTE1fQ09ORklHX0ZJTEUpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoTExNX0NPTkZJR19GSUxFLCAndXRmLTgnKTtcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICByZXMuZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICByZXMuZW5kKCd7fScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDApO1xuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBTdHJpbmcoZXJyKSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICBjb25zdCBjaHVua3M6IEJ1ZmZlcltdID0gW107XG4gICAgICAgICAgcmVxLm9uKCdkYXRhJywgKGNodW5rOiBCdWZmZXIpID0+IGNodW5rcy5wdXNoKGNodW5rKSk7XG4gICAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBib2R5ID0gQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgIC8vIFZhbGlkYXRlIEpTT04gYmVmb3JlIHdyaXRpbmdcbiAgICAgICAgICAgICAgSlNPTi5wYXJzZShib2R5KTtcbiAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKHJlc29sdmUob3MuaG9tZWRpcigpLCAnLm9wZW5yb29tJyksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKExMTV9DT05GSUdfRklMRSwgYm9keSwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwKTtcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IG9rOiB0cnVlIH0pKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogU3RyaW5nKGVycikgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcy53cml0ZUhlYWQoNDA1KTtcbiAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KSk7XG4gICAgICB9KTtcbiAgICB9LFxuICB9O1xufVxuXG4vKipcbiAqIFNlc3Npb24gZGF0YSBwbHVnaW4gXHUyMDE0IHJlYWRzL3dyaXRlcyBmaWxlcyB1bmRlciB+Ly5vcGVucm9vbS9zZXNzaW9ucy9cbiAqIEFQSTogL2FwaS9zZXNzaW9uLWRhdGE/cGF0aD17Y2hhcklkfS97bW9kSWR9L2NoYXQvaGlzdG9yeS5qc29uXG4gKiBTdXBwb3J0cyBHRVQsIFBPU1QsIERFTEVURS5cbiAqL1xuZnVuY3Rpb24gc2Vzc2lvbkRhdGFQbHVnaW4oKTogUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnc2Vzc2lvbi1kYXRhJyxcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL3Nlc3Npb24tZGF0YScsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuXG4gICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybCB8fCAnJywgJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcbiAgICAgICAgY29uc3QgcmVsUGF0aCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdwYXRoJykgfHwgJyc7XG4gICAgICAgIGNvbnN0IGFjdGlvbiA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdhY3Rpb24nKSB8fCAnJztcblxuICAgICAgICBpZiAoIXJlbFBhdGgpIHtcbiAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCk7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWlzc2luZyBwYXRoIHBhcmFtZXRlcicgfSkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNhbml0aXplOiBvbmx5IGFsbG93IGFscGhhbnVtZXJpYywgdW5kZXJzY29yZSwgaHlwaGVuLCBkb3QsIGZvcndhcmQgc2xhc2hcbiAgICAgICAgY29uc3Qgc2FmZVBhdGggPSByZWxQYXRoLnJlcGxhY2UoL1teYS16QS1aMC05X1xcLS4vXS9nLCAnXycpLnJlcGxhY2UoL1xcLlxcLi9nLCAnJyk7XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gam9pbihTRVNTSU9OU19ESVIsIHNhZmVQYXRoKTtcblxuICAgICAgICAvLyBEaXJlY3RvcnkgbGlzdGluZzogP2FjdGlvbj1saXN0JnBhdGg9Li4uXG4gICAgICAgIGlmIChhY3Rpb24gPT09ICdsaXN0JyAmJiByZXEubWV0aG9kID09PSAnR0VUJykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZmlsZVBhdGgpIHx8ICFmcy5zdGF0U3luYyhmaWxlUGF0aCkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBmaWxlczogW10sIG5vdF9leGlzdHM6ICFmcy5leGlzdHNTeW5jKGZpbGVQYXRoKSB9KSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGVudHJpZXMgPSBmcy5yZWFkZGlyU3luYyhmaWxlUGF0aCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuICAgICAgICAgICAgY29uc3QgZmlsZXMgPSBlbnRyaWVzLm1hcCgoZSkgPT4gKHtcbiAgICAgICAgICAgICAgcGF0aDogc2FmZVBhdGggPT09ICcnIHx8IHNhZmVQYXRoID09PSAnLycgPyBlLm5hbWUgOiBgJHtzYWZlUGF0aH0vJHtlLm5hbWV9YCxcbiAgICAgICAgICAgICAgdHlwZTogZS5pc0RpcmVjdG9yeSgpID8gMSA6IDAsXG4gICAgICAgICAgICAgIHNpemU6IGUuaXNEaXJlY3RvcnkoKSA/IDAgOiBmcy5zdGF0U3luYyhqb2luKGZpbGVQYXRoLCBlLm5hbWUpKS5zaXplLFxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGZpbGVzLCBub3RfZXhpc3RzOiBmYWxzZSB9KSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCk7XG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IFN0cmluZyhlcnIpIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdHRVQnKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZpbGVQYXRoKSkge1xuICAgICAgICAgICAgICBjb25zdCBleHQgPSBmaWxlUGF0aC5zcGxpdCgnLicpLnBvcCgpPy50b0xvd2VyQ2FzZSgpIHx8ICcnO1xuICAgICAgICAgICAgICBjb25zdCBiaW5hcnlNaW1lczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICAgICAgICAgICBwbmc6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgICAgIGpwZzogJ2ltYWdlL2pwZWcnLFxuICAgICAgICAgICAgICAgIGpwZWc6ICdpbWFnZS9qcGVnJyxcbiAgICAgICAgICAgICAgICBnaWY6ICdpbWFnZS9naWYnLFxuICAgICAgICAgICAgICAgIHdlYnA6ICdpbWFnZS93ZWJwJyxcbiAgICAgICAgICAgICAgICBzdmc6ICdpbWFnZS9zdmcreG1sJyxcbiAgICAgICAgICAgICAgICBtcDQ6ICd2aWRlby9tcDQnLFxuICAgICAgICAgICAgICAgIHdlYm06ICd2aWRlby93ZWJtJyxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgY29uc3QgbWltZSA9IGJpbmFyeU1pbWVzW2V4dF07XG4gICAgICAgICAgICAgIGlmIChtaW1lKSB7XG4gICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgbWltZSk7XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoZnMucmVhZEZpbGVTeW5jKGZpbGVQYXRoKSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoZnMucmVhZEZpbGVTeW5jKGZpbGVQYXRoLCAndXRmLTgnKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwKTtcbiAgICAgICAgICAgICAgcmVzLmVuZCgne30nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAwKTtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogU3RyaW5nKGVycikgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICAgICAgY29uc3QgY2h1bmtzOiBCdWZmZXJbXSA9IFtdO1xuICAgICAgICAgIHJlcS5vbignZGF0YScsIChjaHVuazogQnVmZmVyKSA9PiBjaHVua3MucHVzaChjaHVuaykpO1xuICAgICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgYnVmID0gQnVmZmVyLmNvbmNhdChjaHVua3MpO1xuICAgICAgICAgICAgICBjb25zdCBkaXIgPSBmaWxlUGF0aC5zdWJzdHJpbmcoMCwgZmlsZVBhdGgubGFzdEluZGV4T2YoJy8nKSk7XG4gICAgICAgICAgICAgIGZzLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICBjb25zdCBjdCA9IChyZXEuaGVhZGVyc1snY29udGVudC10eXBlJ10gfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBjdC5zdGFydHNXaXRoKCdpbWFnZS8nKSB8fFxuICAgICAgICAgICAgICAgIGN0LnN0YXJ0c1dpdGgoJ3ZpZGVvLycpIHx8XG4gICAgICAgICAgICAgICAgY3QgPT09ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIGJ1Zik7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgYnVmLnRvU3RyaW5nKCksICd1dGYtOCcpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwKTtcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IG9rOiB0cnVlIH0pKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogU3RyaW5nKGVycikgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnREVMRVRFJykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkpIHtcbiAgICAgICAgICAgICAgZnMudW5saW5rU3luYyhmaWxlUGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCk7XG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgb2s6IHRydWUgfSkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDApO1xuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBTdHJpbmcoZXJyKSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcy53cml0ZUhlYWQoNDA1KTtcbiAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gU2Vzc2lvbiByZXNldDogREVMRVRFIC9hcGkvc2Vzc2lvbi1kYXRhP2FjdGlvbj1yZXNldCZwYXRoPXtjaGFySWR9L3ttb2RJZH1cbiAgICAgIC8vIFJlY3Vyc2l2ZWx5IHJlbW92ZXMgdGhlIGVudGlyZSBzZXNzaW9uIGRpcmVjdG9yeVxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9zZXNzaW9uLXJlc2V0JywgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnREVMRVRFJykge1xuICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDA1KTtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwgfHwgJycsICdodHRwOi8vbG9jYWxob3N0Jyk7XG4gICAgICAgIGNvbnN0IHJlbFBhdGggPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgncGF0aCcpIHx8ICcnO1xuICAgICAgICBpZiAoIXJlbFBhdGgpIHtcbiAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCk7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWlzc2luZyBwYXRoIHBhcmFtZXRlcicgfSkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNhZmVQYXRoID0gcmVsUGF0aC5yZXBsYWNlKC9bXmEtekEtWjAtOV9cXC0uL10vZywgJ18nKS5yZXBsYWNlKC9cXC5cXC4vZywgJycpO1xuICAgICAgICBjb25zdCB0YXJnZXREaXIgPSBqb2luKFNFU1NJT05TX0RJUiwgc2FmZVBhdGgpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmModGFyZ2V0RGlyKSkge1xuICAgICAgICAgICAgZnMucm1TeW5jKHRhcmdldERpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCk7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IG9rOiB0cnVlIH0pKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDApO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogU3RyaW5nKGVycikgfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICB9O1xufVxuXG4vKiogRGVidWcgbG9nIHBsdWdpbiBcdTIwMTQgd3JpdGVzIGJyb3dzZXIgbG9ncyB0byBsb2dzL2RlYnVnLSoubG9nICovXG5mdW5jdGlvbiBsb2dTZXJ2ZXJQbHVnaW4oKTogUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnbG9nLXNlcnZlcicsXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgY29uc3QgbG9nRGlyID0gam9pbihfX2Rpcm5hbWUsICdsb2dzJyk7XG4gICAgICBjb25zdCBsb2dGaWxlID0gam9pbihsb2dEaXIsIGdlbmVyYXRlTG9nRmlsZU5hbWUoKSk7XG4gICAgICBjb25zdCBtaWRkbGV3YXJlID0gY3JlYXRlTG9nTWlkZGxld2FyZShsb2dGaWxlLCBmcyk7XG5cbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvbG9nJywgbWlkZGxld2FyZSk7XG5cbiAgICAgIHNlcnZlci5odHRwU2VydmVyPy5vbmNlKCdsaXN0ZW5pbmcnLCAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBcXG4gIFtEZWJ1Z0xvZ10gV3JpdGluZyB0bzogJHtsb2dGaWxlfVxcbmApO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfTtcbn1cblxuLyoqIExMTSBBUEkgcHJveHkgcGx1Z2luIFx1MjAxNCByZXNvbHZlcyBicm93c2VyIENPUlMgcmVzdHJpY3Rpb25zICovXG5mdW5jdGlvbiBsbG1Qcm94eVBsdWdpbigpOiBQbHVnaW4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdsbG0tcHJveHknLFxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvbGxtLXByb3h5JywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgIGNvbnN0IHRhcmdldFVybCA9IHJlcS5oZWFkZXJzWyd4LWxsbS10YXJnZXQtdXJsJ10gYXMgc3RyaW5nO1xuICAgICAgICBpZiAoIXRhcmdldFVybCkge1xuICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWlzc2luZyBYLUxMTS1UYXJnZXQtVVJMIGhlYWRlcicgfSkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjaHVua3M6IEJ1ZmZlcltdID0gW107XG4gICAgICAgIHJlcS5vbignZGF0YScsIChjaHVuazogQnVmZmVyKSA9PiBjaHVua3MucHVzaChjaHVuaykpO1xuICAgICAgICByZXEub24oJ2VuZCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IEJ1ZmZlci5jb25jYXQoY2h1bmtzKS50b1N0cmluZygpO1xuICAgICAgICAgICAgY29uc3QgaGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgICAgICAgICAgLy8gRm9yd2FyZCBhbGwgaGVhZGVycyBleGNlcHQgaG9zdC9jb25uZWN0aW9uL2ludGVybmFsIG9uZXNcbiAgICAgICAgICAgIGNvbnN0IHNraXBLZXlzID0gbmV3IFNldChbJ2hvc3QnLCAnY29ubmVjdGlvbicsICdjb250ZW50LWxlbmd0aCcsICd4LWxsbS10YXJnZXQtdXJsJ10pO1xuICAgICAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWxdIG9mIE9iamVjdC5lbnRyaWVzKHJlcS5oZWFkZXJzKSkge1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbCAhPT0gJ3N0cmluZycpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICBpZiAoc2tpcEtleXMuaGFzKGtleSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoJ3gtY3VzdG9tLScpKSB7XG4gICAgICAgICAgICAgICAgaGVhZGVyc1trZXkucmVwbGFjZSgneC1jdXN0b20tJywgJycpXSA9IHZhbDtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzW2tleV0gPSB2YWw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZmV0Y2hSZXMgPSBhd2FpdCBmZXRjaCh0YXJnZXRVcmwsIHtcbiAgICAgICAgICAgICAgbWV0aG9kOiByZXEubWV0aG9kIHx8ICdQT1NUJyxcbiAgICAgICAgICAgICAgaGVhZGVycyxcbiAgICAgICAgICAgICAgYm9keSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKGZldGNoUmVzLnN0YXR1cywge1xuICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogZmV0Y2hSZXMuaGVhZGVycy5nZXQoJ0NvbnRlbnQtVHlwZScpIHx8ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgJ1RyYW5zZmVyLUVuY29kaW5nJzogJ2NodW5rZWQnLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChmZXRjaFJlcy5ib2R5KSB7XG4gICAgICAgICAgICAgIGNvbnN0IHJlYWRlciA9IChmZXRjaFJlcy5ib2R5IGFzIFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+KS5nZXRSZWFkZXIoKTtcbiAgICAgICAgICAgICAgY29uc3QgcHVtcCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHdoaWxlICghZG9uZSkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcbiAgICAgICAgICAgICAgICAgIGRvbmUgPSByZXN1bHQuZG9uZTtcbiAgICAgICAgICAgICAgICAgIGlmICghZG9uZSkgcmVzLndyaXRlKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgcHVtcCgpLmNhdGNoKCgpID0+IHJlcy5lbmQoKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgZmV0Y2hSZXMudGV4dCgpO1xuICAgICAgICAgICAgICByZXMuZW5kKHRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycjogdW5rbm93bikge1xuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDIsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfTtcbn1cblxuLyoqIEdlbmVyaWMgSlNPTiBmaWxlIHBlcnNpc3RlbmNlIHBsdWdpbiBmYWN0b3J5ICovXG5mdW5jdGlvbiBqc29uRmlsZVBsdWdpbihuYW1lOiBzdHJpbmcsIGFwaVBhdGg6IHN0cmluZywgZmlsZVBhdGg6IHN0cmluZyk6IFBsdWdpbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZSxcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFwaVBhdGgsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuXG4gICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnR0VUJykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkpIHtcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICByZXMuZW5kKGZzLnJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0Zi04JykpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICByZXMuZW5kKCd7fScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDApO1xuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBTdHJpbmcoZXJyKSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnUE9TVCcpIHtcbiAgICAgICAgICBjb25zdCBjaHVua3M6IEJ1ZmZlcltdID0gW107XG4gICAgICAgICAgcmVxLm9uKCdkYXRhJywgKGNodW5rOiBCdWZmZXIpID0+IGNodW5rcy5wdXNoKGNodW5rKSk7XG4gICAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBib2R5ID0gQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgIEpTT04ucGFyc2UoYm9keSk7XG4gICAgICAgICAgICAgIGZzLm1rZGlyU3luYyhyZXNvbHZlKG9zLmhvbWVkaXIoKSwgJy5vcGVucm9vbScpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgYm9keSwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjAwKTtcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IG9rOiB0cnVlIH0pKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogU3RyaW5nKGVycikgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcy53cml0ZUhlYWQoNDA1KTtcbiAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KSk7XG4gICAgICB9KTtcbiAgICB9LFxuICB9O1xufVxuXG5jb25zdCBjb25maWcgPSAoeyBtb2RlIH06IENvbmZpZ0Vudik6IFVzZXJDb25maWdFeHBvcnQgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKTtcbiAgY29uc3QgaXNQcm9kID0gZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbic7XG4gIGNvbnN0IGlzVGVzdCA9IGVudi5OT0RFX0VOViA9PT0gJ3Rlc3QnO1xuICBjb25zdCBpc0FuYWx5emUgPSBlbnYuQU5BTFlaRSA9PT0gJ2FuYWx5emUnO1xuICBjb25zdCBzZW50cnlBdXRoVG9rZW4gPSBlbnYuU0VOVFJZX0FVVEhfVE9LRU47XG4gIGNvbnN0IGJpelByb2plY3ROYW1lID0gZW52LkJJWl9QUk9KRUNUX05BTUUgfHwgJyc7XG5cbiAgLy8gQ2FsY3VsYXRlIGFzc2V0IGJhc2UgcGF0aFxuICAvLyAtIFByb2R1Y3Rpb246IENETiBhZGRyZXNzXG4gIC8vIC0gVGVzdDogc3ViLXBhdGggL3dlYnVpYXBwcy9cbiAgLy8gLSBEZXZlbG9wbWVudDogL1xuICBjb25zdCBnZXRCYXNlID0gKCkgPT4ge1xuICAgIGlmIChpc1Byb2QgJiYgZW52LkNETl9QUkVGSVgpIHtcbiAgICAgIHJldHVybiBlbnYuQ0ROX1BSRUZJWCArICcvJyArIGJpelByb2plY3ROYW1lO1xuICAgIH1cbiAgICBpZiAoKGlzVGVzdCB8fCBpc1Byb2QpICYmIGJpelByb2plY3ROYW1lKSB7XG4gICAgICByZXR1cm4gJy8nICsgYml6UHJvamVjdE5hbWUgKyAnLyc7XG4gICAgfVxuICAgIHJldHVybiAnLyc7XG4gIH07XG4gIGNvbnN0IHNraXBMZWdhY3kgPSBlbnYuVklURV9TS0lQX0xFR0FDWSA9PT0gJ3RydWUnO1xuICBjb25zdCBwbHVnaW5zOiBQbHVnaW5PcHRpb25bXSA9IFtcbiAgICBsbG1Db25maWdQbHVnaW4oKSxcbiAgICBzZXNzaW9uRGF0YVBsdWdpbigpLFxuICAgIGxvZ1NlcnZlclBsdWdpbigpLFxuICAgIGxsbVByb3h5UGx1Z2luKCksXG4gICAganNvbkZpbGVQbHVnaW4oJ2NoYXJhY3RlcnMnLCAnL2FwaS9jaGFyYWN0ZXJzJywgQ0hBUkFDVEVSU19GSUxFKSxcbiAgICBqc29uRmlsZVBsdWdpbignbW9kcycsICcvYXBpL21vZHMnLCBNT0RTX0ZJTEUpLFxuICAgIHJlYWN0KCksXG4gICAgLi4uKHNraXBMZWdhY3lcbiAgICAgID8gW11cbiAgICAgIDogW1xuICAgICAgICAgIGxlZ2FjeSh7XG4gICAgICAgICAgICB0YXJnZXRzOiBbJ2RlZmF1bHRzJywgJ25vdCBpZSA8PSAxMScsICdjaHJvbWUgODAnXSxcbiAgICAgICAgICAgIGFkZGl0aW9uYWxMZWdhY3lQb2x5ZmlsbHM6IFsncmVnZW5lcmF0b3ItcnVudGltZS9ydW50aW1lJ10sXG4gICAgICAgICAgICByZW5kZXJMZWdhY3lDaHVua3M6IHRydWUsXG4gICAgICAgICAgICBtb2Rlcm5Qb2x5ZmlsbHM6IHRydWUsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0pLFxuICBdO1xuXG4gIC8qKiBPbmx5IGltcG9ydCB3aGVuIHJ1bm5pbmcgaW4gYW5hbHl6ZSBtb2RlICovXG4gIGlmIChpc0FuYWx5emUpIHtcbiAgICBwbHVnaW5zLnB1c2goXG4gICAgICB2aXN1YWxpemVyKHtcbiAgICAgICAgZ3ppcFNpemU6IHRydWUsXG4gICAgICAgIG9wZW46IHRydWUsXG4gICAgICAgIGZpbGVuYW1lOiBgJHtlbnYuQVBQX05BTUV9LWNodW5rLmh0bWxgLFxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIGlmIChpc1Byb2QgJiYgc2VudHJ5QXV0aFRva2VuKSB7XG4gICAgcGx1Z2lucy5wdXNoKFxuICAgICAgc2VudHJ5Vml0ZVBsdWdpbih7XG4gICAgICAgIGF1dGhUb2tlbjogc2VudHJ5QXV0aFRva2VuLFxuICAgICAgICBvcmc6IGVudi5TRU5UUllfT1JHIHx8ICcnLFxuICAgICAgICBwcm9qZWN0OiBlbnYuU0VOVFJZX1BST0pFQ1QgfHwgJycsXG4gICAgICAgIHVybDogZW52LlNFTlRSWV9VUkwgfHwgdW5kZWZpbmVkLFxuICAgICAgICBzb3VyY2VtYXBzOiB7XG4gICAgICAgICAgZmlsZXNUb0RlbGV0ZUFmdGVyVXBsb2FkOiBbJ2Rpc3QvKiovKi5qcy5tYXAnXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHBsdWdpbnMsXG4gICAgY3NzOiB7XG4gICAgICBwb3N0Y3NzOiB7XG4gICAgICAgIHBsdWdpbnM6IFthdXRvcHJlZml4ZXIoe30pXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcbiAgICAgICAgJ0BndWkvdmliZS1jb250YWluZXInOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2xpYi92aWJlQ29udGFpbmVyTW9jay50cycpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGJhc2U6IGdldEJhc2UoKSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IHRydWUsXG4gICAgICBwb3J0OiAzMDAwLFxuICAgIH0sXG4gICAgZGVmaW5lOiB7XG4gICAgICBfX0FQUF9fOiBKU09OLnN0cmluZ2lmeShlbnYuQVBQX0VOVklST05NRU5UKSxcbiAgICAgIF9fUk9VVEVSX0JBU0VfXzogSlNPTi5zdHJpbmdpZnkoYml6UHJvamVjdE5hbWUgPyAnLycgKyBiaXpQcm9qZWN0TmFtZSA6ICcnKSxcbiAgICAgIF9fRU5WX186IEpTT04uc3RyaW5naWZ5KGVudi5OT0RFX0VOViksXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgJ3ZlbmRvci1yZWFjdCc6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAgICd2ZW5kb3ItbHVjaWRlJzogWydsdWNpZGUtcmVhY3QnXSxcbiAgICAgICAgICAgICd2ZW5kb3ItaTE4bic6IFsnaTE4bmV4dCcsICdyZWFjdC1pMThuZXh0J10sXG4gICAgICAgICAgICAndmVuZG9yLWZyYW1lcic6IFsnZnJhbWVyLW1vdGlvbiddLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYXNzZXRGaWxlTmFtZXM6IChhc3NldEluZm8pID0+IHtcbiAgICAgICAgICAgIGlmIChhc3NldEluZm8ubmFtZT8uZW5kc1dpdGgoJy5jc3MnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2Fzc2V0cy9zdHlsZXMvW25hbWVdLVtoYXNoXVtleHRuYW1lXSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoL1xcLihwbmd8anBlP2d8Z2lmfHN2ZykkLy50ZXN0KGFzc2V0SW5mby5uYW1lIHx8ICcnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2Fzc2V0cy9pbWFnZXMvW25hbWVdLVtoYXNoXVtleHRuYW1lXSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgvXFwuKHR0ZikkLy50ZXN0KGFzc2V0SW5mby5uYW1lIHx8ICcnKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ2Fzc2V0cy9mb250cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICdbbmFtZV0tW2hhc2hdW2V4dG5hbWVdJztcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxNTAwLFxuICAgICAgY3NzVGFyZ2V0OiAnY2hyb21lNjEnLFxuICAgICAgc291cmNlbWFwOiBpc1Byb2QsXG4gICAgICBtYW5pZmVzdDogdHJ1ZSxcbiAgICAgIHRhcmdldDogJ2VzbmV4dCcsXG4gICAgfSxcbiAgfTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbmZpZztcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcQUljcmVhdGVFbmdpbmVcXFxccHl0aG9uSURFXFxcXHNuYWtlXFxcXEFnZW50XHU2RDRGXHU4OUM4XHU1NjY4XHU2ODRDXHU5NzYyXFxcXE9wZW5Sb29tLW1haW5cXFxcT3BlblJvb20tbWFpblxcXFxhcHBzXFxcXHdlYnVpYXBwc1xcXFxzcmNcXFxcbGliXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxBSWNyZWF0ZUVuZ2luZVxcXFxweXRob25JREVcXFxcc25ha2VcXFxcQWdlbnRcdTZENEZcdTg5QzhcdTU2NjhcdTY4NENcdTk3NjJcXFxcT3BlblJvb20tbWFpblxcXFxPcGVuUm9vbS1tYWluXFxcXGFwcHNcXFxcd2VidWlhcHBzXFxcXHNyY1xcXFxsaWJcXFxcbG9nUGx1Z2luLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9BSWNyZWF0ZUVuZ2luZS9weXRob25JREUvc25ha2UvQWdlbnQlRTYlQjUlOEYlRTglQTclODglRTUlOTklQTglRTYlQTElOEMlRTklOUQlQTIvT3BlblJvb20tbWFpbi9PcGVuUm9vbS1tYWluL2FwcHMvd2VidWlhcHBzL3NyYy9saWIvbG9nUGx1Z2luLnRzXCI7LyoqXG4gKiBMb2cgUGx1Z2luIFx1MjAxNCBOb2RlLmpzIE9OTFlcbiAqIENvcmUgbG9naWMgZm9yIHRoZSBWaXRlIGRldi1zZXJ2ZXIgbG9nIG1pZGRsZXdhcmUuXG4gKiBEbyBOT1QgaW1wb3J0IHRoaXMgZmlsZSBmcm9tIGZyb250ZW5kIGNvZGUuXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBJbmNvbWluZ01lc3NhZ2UsIFNlcnZlclJlc3BvbnNlIH0gZnJvbSAnaHR0cCc7XG5pbXBvcnQgdHlwZSAqIGFzIGZzVHlwZSBmcm9tICdmcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9nQm9keSB7XG4gIGxldmVsOiBzdHJpbmc7XG4gIHRhZzogc3RyaW5nO1xuICBhcmdzOiB1bmtub3duW107XG4gIHRzOiBudW1iZXI7XG59XG5cbmNvbnN0IHBhZCA9IChuOiBudW1iZXIpID0+IFN0cmluZyhuKS5wYWRTdGFydCgyLCAnMCcpO1xuY29uc3QgcGFkMyA9IChuOiBudW1iZXIpID0+IFN0cmluZyhuKS5wYWRTdGFydCgzLCAnMCcpO1xuXG4vKipcbiAqIEdlbmVyYXRlIGxvZyBmaWxlIG5hbWUgd2l0aCBsb2NhbC10aW1lIHRpbWVzdGFtcC5cbiAqIEZvcm1hdDogZGVidWctWVlZWS1NTS1ERF9ISC1tbS1zcy5sb2dcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlTG9nRmlsZU5hbWUobm93OiBEYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIGNvbnN0IGRhdGUgPSBgJHtub3cuZ2V0RnVsbFllYXIoKX0tJHtwYWQobm93LmdldE1vbnRoKCkgKyAxKX0tJHtwYWQobm93LmdldERhdGUoKSl9YDtcbiAgY29uc3QgdGltZSA9IGAke3BhZChub3cuZ2V0SG91cnMoKSl9LSR7cGFkKG5vdy5nZXRNaW51dGVzKCkpfS0ke3BhZChub3cuZ2V0U2Vjb25kcygpKX1gO1xuICByZXR1cm4gYGRlYnVnLSR7ZGF0ZX1fJHt0aW1lfS5sb2dgO1xufVxuXG4vKipcbiAqIEZvcm1hdCBhIHNpbmdsZSBsb2cgbGluZSB1c2luZyBsb2NhbCB0aW1lIChjb25zaXN0ZW50IHdpdGggZmlsZSBuYW1lKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdExvZ0xpbmUoYm9keTogTG9nQm9keSk6IHN0cmluZyB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZShib2R5LnRzKTtcbiAgY29uc3QgdGltZSA9XG4gICAgYCR7ZC5nZXRGdWxsWWVhcigpfS0ke3BhZChkLmdldE1vbnRoKCkgKyAxKX0tJHtwYWQoZC5nZXREYXRlKCkpfSBgICtcbiAgICBgJHtwYWQoZC5nZXRIb3VycygpKX06JHtwYWQoZC5nZXRNaW51dGVzKCkpfToke3BhZChkLmdldFNlY29uZHMoKSl9LiR7cGFkMyhkLmdldE1pbGxpc2Vjb25kcygpKX1gO1xuICBjb25zdCBhcmdzU3RyID0gYm9keS5hcmdzXG4gICAgLm1hcCgoYSkgPT4gKGEgIT09IG51bGwgJiYgdHlwZW9mIGEgPT09ICdvYmplY3QnID8gSlNPTi5zdHJpbmdpZnkoYSkgOiBTdHJpbmcoYSkpKVxuICAgIC5qb2luKCcgJyk7XG4gIHJldHVybiBgJHt0aW1lfSBbJHtib2R5LmxldmVsLnRvVXBwZXJDYXNlKCl9XSBbJHtib2R5LnRhZ31dICR7YXJnc1N0cn1gO1xufVxuXG50eXBlIEZzTGlrZSA9IFBpY2s8dHlwZW9mIGZzVHlwZSwgJ2FwcGVuZEZpbGVTeW5jJyB8ICdleGlzdHNTeW5jJyB8ICdta2RpclN5bmMnPjtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIC9hcGkvbG9nIEV4cHJlc3Mtc3R5bGUgbWlkZGxld2FyZS5cbiAqIEFjY2VwdHMgUE9TVCByZXF1ZXN0cyB3aXRoIExvZ0JvZHkgSlNPTiwgYXBwZW5kcyBmb3JtYXR0ZWQgbGluZXMgdG8gbG9nRmlsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxvZ01pZGRsZXdhcmUobG9nRmlsZTogc3RyaW5nLCBmc01vZHVsZTogRnNMaWtlKSB7XG4gIGNvbnN0IGxvZ0RpciA9IGxvZ0ZpbGUuc3BsaXQoJy8nKS5zbGljZSgwLCAtMSkuam9pbignLycpO1xuXG4gIHJldHVybiAocmVxOiBJbmNvbWluZ01lc3NhZ2UsIHJlczogU2VydmVyUmVzcG9uc2UsIF9uZXh0OiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgICAgcmVzLndyaXRlSGVhZCg0MDUpO1xuICAgICAgcmVzLmVuZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNodW5rczogQnVmZmVyW10gPSBbXTtcbiAgICByZXEub24oJ2RhdGEnLCAoY2h1bms6IEJ1ZmZlcikgPT4gY2h1bmtzLnB1c2goY2h1bmspKTtcbiAgICByZXEub24oJ2VuZCcsICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGJvZHk6IExvZ0JvZHkgPSBKU09OLnBhcnNlKEJ1ZmZlci5jb25jYXQoY2h1bmtzKS50b1N0cmluZygpKTtcbiAgICAgICAgY29uc3QgbGluZSA9IGZvcm1hdExvZ0xpbmUoYm9keSk7XG4gICAgICAgIGlmICghZnNNb2R1bGUuZXhpc3RzU3luYyhsb2dEaXIpKSB7XG4gICAgICAgICAgZnNNb2R1bGUubWtkaXJTeW5jKGxvZ0RpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZnNNb2R1bGUuYXBwZW5kRmlsZVN5bmMobG9nRmlsZSwgbGluZSArICdcXG4nLCAndXRmOCcpO1xuICAgICAgICByZXMud3JpdGVIZWFkKDIwNCk7XG4gICAgICAgIHJlcy5lbmQoKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXMud3JpdGVIZWFkKDQwMCk7XG4gICAgICAgIHJlcy5lbmQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaWYsU0FBc0MsZUFBZTtBQUV0aUIsT0FBTyxZQUFZO0FBQ25CLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxrQkFBa0I7QUFDM0IsT0FBTyxrQkFBa0I7QUFDekIsU0FBUyx3QkFBd0I7QUFDakMsWUFBWSxRQUFRO0FBQ3BCLFlBQVksUUFBUTtBQUNwQixTQUFTLFlBQVk7OztBQ01yQixJQUFNLE1BQU0sQ0FBQyxNQUFjLE9BQU8sQ0FBQyxFQUFFLFNBQVMsR0FBRyxHQUFHO0FBQ3BELElBQU0sT0FBTyxDQUFDLE1BQWMsT0FBTyxDQUFDLEVBQUUsU0FBUyxHQUFHLEdBQUc7QUFNOUMsU0FBUyxvQkFBb0IsTUFBWSxvQkFBSSxLQUFLLEdBQVc7QUFDbEUsUUFBTSxPQUFPLEdBQUcsSUFBSSxZQUFZLENBQUMsSUFBSSxJQUFJLElBQUksU0FBUyxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxRQUFRLENBQUMsQ0FBQztBQUNsRixRQUFNLE9BQU8sR0FBRyxJQUFJLElBQUksU0FBUyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksV0FBVyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksV0FBVyxDQUFDLENBQUM7QUFDckYsU0FBTyxTQUFTLElBQUksSUFBSSxJQUFJO0FBQzlCO0FBS08sU0FBUyxjQUFjLE1BQXVCO0FBQ25ELFFBQU0sSUFBSSxJQUFJLEtBQUssS0FBSyxFQUFFO0FBQzFCLFFBQU0sT0FDSixHQUFHLEVBQUUsWUFBWSxDQUFDLElBQUks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
