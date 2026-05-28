#!/usr/bin/env node
/**
 * Bilingual completeness check for passion4it.de content collections.
 *
 * For every collection under src/content/<name>/{de,en}/ every translationKey
 * must appear in BOTH locales. Exits 0 on success, 1 if any problem is found.
 *
 * Usage:
 *   node scripts/check-bilingual.mjs [--root=<path>]
 *
 * --root defaults to ./src/content
 */

import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { styleText } from "node:util";
import matter from "gray-matter";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const rootArg = process.argv.find((a) => a.startsWith("--root="));
const root = rootArg ? rootArg.slice("--root=".length) : "./src/content";

// ---------------------------------------------------------------------------
// Colour helpers — degrade gracefully when not a TTY
// ---------------------------------------------------------------------------
const isTTY = process.stdout.isTTY;
const red = (s) => (isTTY ? styleText("red", s) : s);
const green = (s) => (isTTY ? styleText("green", s) : s);
const yellow = (s) => (isTTY ? styleText("yellow", s) : s);
const bold = (s) => (isTTY ? styleText("bold", s) : s);

/** @type {string[]} */
const errors = [];

// ---------------------------------------------------------------------------
// Discover collections (subdirectories of root)
// ---------------------------------------------------------------------------
let collections = [];
if (!existsSync(root)) {
  console.log("bilingual check: no collections");
} else {
  const entries = readdirSync(root);
  collections = entries.filter((name) => {
    try {
      return statSync(join(root, name)).isDirectory();
    } catch {
      return false;
    }
  });
  if (collections.length === 0) {
    console.log("bilingual check: no collections");
  }
}

// ---------------------------------------------------------------------------
// Per-collection analysis
// ---------------------------------------------------------------------------
for (const collection of collections) {
  const collectionDir = join(root, collection);

  /**
   * For a given locale, read all .md files and return a Map<translationKey, filename>.
   * Duplicate keys are caught here and added to errors.
   * @param {string} locale
   * @returns {Map<string, string>}
   */
  function readLocale(locale) {
    const dir = join(collectionDir, locale);
    /** @type {Map<string, string>} */
    const keys = new Map();

    if (!existsSync(dir)) return keys;

    const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const filePath = join(dir, file);
      let parsed;
      try {
        parsed = matter(readFileSync(filePath, "utf8"));
      } catch (e) {
        errors.push(
          `${red("ERROR")} ${collection}/${locale}/${file}: could not parse frontmatter — ${e.message}`,
        );
        continue;
      }

      const key = parsed.data.translationKey;
      if (typeof key !== "string" || key.trim() === "") {
        errors.push(
          `${red("ERROR")} ${collection}/${locale}/${file}: missing or empty translationKey field`,
        );
        continue;
      }

      if (keys.has(key)) {
        errors.push(
          `${red("ERROR")} ${collection} / ${locale}: duplicate translationKey ${key} ` +
            `in files ${keys.get(key)} and ${file}`,
        );
      } else {
        keys.set(key, file);
      }
    }

    return keys;
  }

  const deKeys = readLocale("de");
  const enKeys = readLocale("en");

  if (deKeys.size === 0 && enKeys.size === 0) {
    console.log(yellow(`${collection}: no entries`));
    continue;
  }

  // Symmetric difference
  let collectionOk = true;

  for (const [key] of deKeys) {
    if (!enKeys.has(key)) {
      errors.push(
        `${red("ERROR")} ${collection}: key ${key} exists in de but is missing in en`,
      );
      collectionOk = false;
    }
  }

  for (const [key] of enKeys) {
    if (!deKeys.has(key)) {
      errors.push(
        `${red("ERROR")} ${collection}: key ${key} exists in en but is missing in de`,
      );
      collectionOk = false;
    }
  }

  if (collectionOk) {
    const count = deKeys.size;
    console.log(green(`${collection}: ${count}/${count} balanced`));
  }
}

// ---------------------------------------------------------------------------
// Locale-paired static assets
// BaseLayout interpolates `/og-default-${lang}.png` unconditionally, so a
// half-state (one locale present, the other missing) would render a broken
// og:image meta tag on the missing-locale pages without any other check
// catching it. Enforce here so `pnpm generate-og --lang de` alone never
// reaches a build.
// ---------------------------------------------------------------------------
const localePairedAssets = [
  ["public/og-default-de.png", "public/og-default-en.png"],
];
for (const [dePath, enPath] of localePairedAssets) {
  const deExists = existsSync(dePath);
  const enExists = existsSync(enPath);
  if (deExists && !enExists) {
    errors.push(
      `${red("ERROR")} ${dePath} exists but ${enPath} is missing — run \`pnpm generate-og\` to regenerate both`,
    );
  } else if (enExists && !deExists) {
    errors.push(
      `${red("ERROR")} ${enPath} exists but ${dePath} is missing — run \`pnpm generate-og\` to regenerate both`,
    );
  } else if (deExists && enExists) {
    const label = dePath.replace(/-de(\.[^.]+)$/, "-{de,en}$1");
    console.log(green(`${label}: present`));
  }
  // Both missing is fine — `BaseLayout`'s consumer never reached the OG
  // generator, and the page still renders (just without an og:image asset).
}

// ---------------------------------------------------------------------------
// Final verdict
// ---------------------------------------------------------------------------
if (errors.length > 0) {
  console.log("");
  console.log("Bilingual check failed:");
  for (const msg of errors) {
    console.log(`  ${msg}`);
  }
  process.exit(1);
}
