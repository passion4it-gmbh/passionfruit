#!/usr/bin/env node
/**
 * Fixture-brand leak check for the passionfruit template.
 *
 * The template ships example content branded "Greenleaf Digital". That brand
 * belongs ONLY in replaceable fixtures — `src/content`, `src/i18n`, `src/data`
 * (and the dev-only `src/pages/design-floor` showcase). It must never be
 * hardcoded into shipped code (layouts, components, lib, pages), where
 * `/onboard` can't reliably reach it. Brand identity in code is derived from
 * the `site.name` i18n string and `Astro.site` instead.
 *
 * This guards the template/instance seam: it fails the build if the fixture
 * brand reappears in code. After `/onboard` rewrites the fixtures, the token is
 * gone everywhere and the check is a trivial pass.
 *
 * Exits 0 on success, 1 if the fixture brand leaked into code.
 *
 * Usage:
 *   node scripts/check-fixtures.mjs [--root=<path>]
 *
 * --root defaults to ./src
 */

import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { join, relative, sep, extname } from "node:path";
import { styleText } from "node:util";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const rootArg = process.argv.find((a) => a.startsWith("--root="));
const root = rootArg ? rootArg.slice("--root=".length) : "./src";

// ---------------------------------------------------------------------------
// Colour helpers — degrade gracefully when not a TTY
// ---------------------------------------------------------------------------
const isTTY = process.stdout.isTTY;
const red = (s) => (isTTY ? styleText("red", s) : s);
const green = (s) => (isTTY ? styleText("green", s) : s);

// ---------------------------------------------------------------------------
// What counts as a leak
// ---------------------------------------------------------------------------
// The fixture brand the template ships with. Hardcoding this into code is the
// bug we catch; a re-themed downstream site has none of it, so this is a
// no-op there.
const FIXTURE_BRAND = /greenleaf/i;

// Shipped code — brand here is a bug.
const CODE_EXTENSIONS = new Set([
  ".astro",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".css",
]);

// Replaceable fixtures + dev-only showcase — brand here is expected. Paths are
// relative to --root.
const EXCLUDED_DIRS = [
  "content",
  "i18n",
  "data",
  join("pages", "design-floor"),
];

const isExcluded = (relPath) =>
  EXCLUDED_DIRS.some((d) => relPath === d || relPath.startsWith(d + sep));

// ---------------------------------------------------------------------------
// Walk the tree, collecting leaks
// ---------------------------------------------------------------------------
/** @type {string[]} */
const leaks = [];

/** @param {string} dir */
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (isExcluded(relative(root, abs))) continue;
    if (statSync(abs).isDirectory()) {
      walk(abs);
    } else if (CODE_EXTENSIONS.has(extname(name))) {
      readFileSync(abs, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (FIXTURE_BRAND.test(line)) {
            leaks.push(`${abs}:${i + 1}  ${line.trim()}`);
          }
        });
    }
  }
}

if (!existsSync(root)) {
  console.log("fixture check: no source directory");
  process.exit(0);
}

walk(root);

// ---------------------------------------------------------------------------
// Final verdict
// ---------------------------------------------------------------------------
if (leaks.length > 0) {
  console.log("");
  console.log(red("Fixture check failed:") + ` brand leaked into code`);
  for (const leak of leaks) {
    console.log(`  ${leak}`);
  }
  console.log("");
  console.log(
    "Brand identity must come from the `site.name` i18n string + `Astro.site`,",
  );
  console.log("not string literals. Move it into src/i18n/{de,en}.json.");
  process.exit(1);
}

console.log(green("fixture check: no brand literals in code"));
