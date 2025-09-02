#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import express from "express";
import open from "open";

// Parse CLI arguments supporting both --key=value and --key value
const argv = process.argv.slice(2);
let mdPathArg = null;
let port = 8000;
let theme = "black";
let noUppercaseHeadings = false;
let showSpeakerNotes = false;

for (let i = 0; i < argv.length; i++) {
  const tok = argv[i];
  if (tok === "--") continue; // ignore a standalone separator
  if (tok === "--no-uppercase") { noUppercaseHeadings = true; continue; }
  if (tok === "--show-notes") { showSpeakerNotes = true; continue; }
  if (tok.startsWith("--port")) {
    let val = null;
    if (tok.includes("=")) val = tok.split("=")[1];
    else if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) { val = argv[++i]; }
    if (val == null || val === "") {
      console.error("Missing value for --port. Use --port 8000 or --port=8000");
      process.exit(1);
    }
    const n = Number(val);
    if (!Number.isInteger(n) || n <= 0 || n > 65535) {
      console.error("Invalid port:", val);
      process.exit(1);
    }
    port = n;
    continue;
  }
  if (tok.startsWith("--theme")) {
    let val = null;
    if (tok.includes("=")) val = tok.split("=")[1];
    else if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) { val = argv[++i]; }
    if (val == null || val === "") {
      console.error("Missing value for --theme. Use --theme black or --theme=black");
      process.exit(1);
    }
    theme = val;
    continue;
  }
  // First non-option token is the markdown path
  if (!tok.startsWith("-") && mdPathArg === null) {
    mdPathArg = tok;
    continue;
  }
}

if (!mdPathArg) {
  console.error("Usage: node present.js <slides.md> [--port 8000|--port=8000] [--theme black|--theme=black] [--no-uppercase] [--show-notes]");
  process.exit(1);
}

const mdPath = path.resolve(mdPathArg);
if (!fs.existsSync(mdPath) || !fs.statSync(mdPath).isFile()) {
  console.error("Markdown file not found:", mdPath);
  process.exit(1);
}

const app = express();
const require = createRequire(import.meta.url);
const revealPkg = require.resolve("reveal.js/package.json");
const revealRoot = path.dirname(revealPkg);
// Verify theme CSS exists; if not, print available themes and exit
const themeCssPath = path.join(revealRoot, "dist", "theme", `${theme}.css`);
if (!fs.existsSync(themeCssPath)) {
  const themeDir = path.join(revealRoot, "dist", "theme");
  let available = [];
  try {
    available = fs
      .readdirSync(themeDir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith(".css"))
      .map((e) => path.basename(e.name, ".css"))
      .sort();
  } catch {}
  console.error(
    `Theme not found: ${theme}. Available themes: ${available.join(", ")}`
  );
  process.exit(1);
}
const slidesDir = path.dirname(mdPath);

app.use("/reveal.js", express.static(revealRoot));
app.use(express.static(slidesDir));

app.get("/slides", (_req, res) => {
  res.type("text/markdown; charset=utf-8");
  fs.createReadStream(mdPath).pipe(res);
});

app.get("/", (_req, res) => {
  const headingOverrideCss = noUppercaseHeadings
    ? `.reveal h1, .reveal h2, .reveal h3, .reveal h4, .reveal h5, .reveal h6 { text-transform: none !important; letter-spacing: normal !important; }`
    : "";
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
  :root { --r-main-font-size: 34px; --r-heading1-size: 2.5em; --r-heading2-size: 1.8em; --r-block-margin: 16px; }
  ${headingOverrideCss}
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
  Reveal.initialize({ 
    hash: true,
    plugins: [ RevealMarkdown, RevealNotes ],
    width: 1280,          // logical slide size
    height: 720,          // 16:9
    margin: 0.06,         // whitespace around slide
    minScale: 0.2,        // avoid tiny screens shrinking too much
    maxScale: 1.0,        // CAP UPSCALING to keep fonts reasonable
    center: true,         // top-align to free more space for content
    showNotes: ${showSpeakerNotes}
  });
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
