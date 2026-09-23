#!/usr/bin/env node
/**
 * Build a fully standalone index.html:
 *  - Generates Tailwind CSS from the classes used in index.html
 *  - Inlines that CSS + the Inter variable font (base64) into a single <style>
 *  - Strips the Tailwind CDN <script>, the inline tailwind.config, and Google Fonts links
 *
 * Idempotent: safe to run after editing index.html (the inlined <style> is replaced,
 * not duplicated). Afterwards index.html works offline by double-click.
 *
 * Usage: npm run build
 */
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const REPO_ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));
const htmlPath = join(REPO_ROOT, "index.html");
const fontPath = join(REPO_ROOT, "assets", "fonts", "inter-latin-wght-normal.woff2");
const STYLE_ID = "tailwind-standalone";

if (!(await import("node:fs")).existsSync(htmlPath)) {
  console.error(`✗ ${htmlPath} not found`);
  process.exit(1);
}

// 1. Generate Tailwind CSS
const tmpDir = mkdtempSync(join(tmpdir(), "arptw-"));
const inputCss = join(tmpDir, "input.css");
const outputCss = join(tmpDir, "output.css");
writeFileSync(inputCss, "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n");

const tailwindCli = join(REPO_ROOT, "node_modules", "tailwindcss", "lib", "cli.js");
const result = spawnSync(
  process.execPath,
  [tailwindCli, "-i", inputCss, "-o", outputCss, "--content", htmlPath, "--config", join(REPO_ROOT, "tailwind.config.js"), "--minify"],
  { encoding: "utf8" },
);
if (result.status !== 0) {
  console.error(`✗ Tailwind failed:\n${result.stderr || result.stdout}`);
  rmSync(tmpDir, { recursive: true, force: true });
  process.exit(1);
}
let css = readFileSync(outputCss, "utf8").trim();
rmSync(tmpDir, { recursive: true, force: true });

// 2. Embed the Inter variable font
const fontBase64 = readFileSync(fontPath).toString("base64");
css = [
  `@font-face{font-family:'Inter';font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,${fontBase64}) format('woff2');}`,
  css,
].join("\n");

// 3. Rewrite index.html
let html = readFileSync(htmlPath, "utf8");
const before = html.length;

// Strip Tailwind CDN script
html = html.replace(
  /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*/,
  "<!-- Tailwind CSS inlined by npm run build -->\n",
);
// Strip inline tailwind.config block
html = html.replace(
  /<script>\s*tailwind\.config\s*=\s*\{[\s\S]*?\}\s*<\/script>\s*/,
  "",
);
// Strip Google Fonts links (preconnect + stylesheet)
html = html.replace(
  /<!-- Google Fonts -->[\s\S]*?<link href="https:\/\/fonts\.googleapis\.com[\s\S]*?" rel="stylesheet">\s*/,
  "",
);

// Replace or insert the inlined <style>
const styleTag = (content) => `<style id="${STYLE_ID}">\n${content}\n    </style>`;
if (html.includes(`id="${STYLE_ID}"`)) {
  html = html.replace(
    new RegExp(`<style id="${STYLE_ID}">[\\s\\S]*?</style>`),
    () => styleTag(css),
  );
} else {
  html = html.replace("</head>", `    ${styleTag(css)}\n</head>`);
}

writeFileSync(htmlPath, html);
const delta = ((html.length - before) / 1024).toFixed(0);
console.log(`✓ Built standalone index.html (${(html.length / 1024).toFixed(0)} KB, ${delta > 0 ? "+" : ""}${delta} KB) — offline ready.`);