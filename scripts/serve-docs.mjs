import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const docsRoot = resolve("docs");
const port = Number(process.env.PORT ?? 4173);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".wasm", "application/wasm"],
  [".map", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"]
]);

function resolveRequest(url = "/") {
  const decoded = decodeURIComponent(url.split("?")[0] ?? "/");
  const withoutBase = decoded.startsWith("/research-flow/")
    ? decoded.slice("/research-flow/".length)
    : decoded.replace(/^\/+/, "");
  const candidate = normalize(join(docsRoot, withoutBase || "index.html"));

  if (!candidate.startsWith(docsRoot)) return join(docsRoot, "404.html");
  if (existsSync(candidate) && statSync(candidate).isDirectory())
    return join(candidate, "index.html");
  if (existsSync(candidate)) return candidate;
  return join(docsRoot, "404.html");
}

const server = createServer((request, response) => {
  const filePath = resolveRequest(request.url);
  const type = contentTypes.get(extname(filePath)) ?? "application/octet-stream";
  response.setHeader("Content-Type", type);
  response.setHeader("Cache-Control", "no-store");
  createReadStream(filePath)
    .on("error", () => {
      response.statusCode = 404;
      response.end("Not found");
    })
    .pipe(response);
});

server.listen(port, () => {
  console.log(`Serving docs at http://127.0.0.1:${port}/research-flow/`);
});
