# Reveal Presenter

A tiny local presenter that serves a Markdown file as a Reveal.js slide deck with sensible defaults. It launches a local Express server, opens your browser, and renders slides directly from your Markdown file.

## Requirements
- Node.js 18 or newer
- A Markdown file with slide separators (see below)

## Install
```
npm install
```

## Quick Start

Recommended (no install):
```
npx github:dpolivaev/reveal-presenter -- path/to/slides.md [flags]
```
- Fetches and runs from GitHub via npx
- Opens `http://localhost:8000/` in your default browser
- Uses the `black` theme by default; speaker notes are hidden by default

Alternatives:
```
node present.js path/to/slides.md [flags]
```

### Run as an executable (shebang)
The script has a shebang, so you can run it directly:
```
./present.js path/to/slides.md --theme=black --show-notes
```
If needed, make it executable once:
```
chmod +x present.js
```

## Command Reference
```
node present.js <slides.md> [--port 8000] [--theme=black] [--no-uppercase] [--show-notes]
```
- `--port <number>`: Port to run the local server (default `8000`). Both `--port=8000` and `--port 8000` are supported.
- `--theme <name>`: Reveal.js theme name (default `black`). The script validates that `reveal.js/dist/theme/<name>.css` exists and fails with a helpful list if not found.
- `--no-uppercase`: Do not force uppercase headings; keeps your original Markdown casing.
- `--show-notes`: Show speaker notes on the slide deck. By default notes are hidden; you can still open the separate speaker console with the `s` shortcut.

## Markdown Conventions
Slides are split using common Reveal.js Markdown plugin separators:
- Horizontal slide: a line with `---` (three dashes) on its own line
- Vertical slide (stack): a line with `--` (two dashes) on its own line
- Speaker notes: a line starting with `Note:`; everything after that line (until the next slide separator) is treated as notes

Minimal example:
```
# Title Slide

---

## Second Slide
Some content.

Note:
These are speaker notes for the second slide.

--

### Vertical Slide
More content.
```

## Themes
The `--theme` flag must match a file in `node_modules/reveal.js/dist/theme/` without the `.css` extension, for example:
- `black`
- `white`
- `league`
- `beige`
- `night`
- `moon`
- `serif`
- `simple`
- `solarized`

If you pass an unknown theme, the script prints a list of available themes and exits with a non‑zero status code.
