import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import express from "express";
import open from "open";

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node present.mjs <slides.md> [--port 8000] [--theme black]");
  process.exit(1);
}
const mdPath = path.resolve(args[0]);
if (!fs.existsSync(mdPath) || !fs.statSync(mdPath).isFile()) {
  console.error("Markdown file not found:", mdPath);
  process.exit(1);
}
const portArg = args.find(a => a.startsWith("--port"));
const themeArg = args.find(a => a.startsWith("--theme"));
const port = portArg ? Number(portArg.split(" ")[1] || portArg.split("=")[1]) : 8000;
const theme = themeArg ? (themeArg.split(" ")[1] || themeArg.split("=")[1]) : "black";

const app = express();
const require = createRequire(import.meta.url);
const revealPkg = require.resolve("reveal.js/package.json");
const revealRoot = path.dirname(revealPkg);
const slidesDir = path.dirname(mdPath);

app.use("/reveal.js", express.static(revealRoot));
app.use(express.static(slidesDir));

app.get("/slides", (_req, res) => {
  res.type("text/markdown; charset=utf-8");
  fs.createReadStream(mdPath).pipe(res);
});

app.get("/", (_req, res) => {
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${path.basename(mdPath)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="/reveal.js/dist/reveal.css">
<link rel="stylesheet" href="/reveal.js/dist/theme/${theme}.css" id="theme">
<style>
  html, body, .reveal { height:100%; }
</style>
</head>
<body>
<div class="reveal">
  <div class="slides">
    <section data-markdown="/slides"
             data-separator="^\\n---\\n$"
             data-separator-vertical="^\\n--\\n$"
             data-separator-notes="^Note:">
    </section>
  </div>
</div>
<script src="/reveal.js/dist/reveal.js"></script>
<script src="/reveal.js/plugin/markdown/markdown.js"></script>
<script src="/reveal.js/plugin/notes/notes.js"></script>
<script>
  Reveal.initialize({ hash: true, plugins: [ RevealMarkdown, RevealNotes ] });
</script>
</body>
</html>`;
  res.type("html").send(html);
});

app.listen(port, () => {
  const url = `http://localhost:${port}/`;
  console.log("Serving", mdPath, "at", url);
  open(url);
});
