#!/usr/bin/env node
/**
 * Component sidecar documentation coverage check.
 *
 * Walks src/components (or --root) recursively and enforces that every
 * .astro file has a sibling .md sidecar. Also flags orphaned .md files
 * that have no matching .astro component.
 *
 * Usage:
 *   node scripts/check-component-docs.mjs [--root=<path>]
 *
 * Exit codes:
 *   0 — all components have sidecars, no orphans
 *   1 — missing sidecars and/or orphaned .md files found
 *
 * --root defaults to ./src/components
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import matter from "gray-matter";
import { styleText } from "node:util";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const rootArg = process.argv.find((a) => a.startsWith("--root="));
const root = rootArg ? rootArg.slice("--root=".length) : "./src/components";

// ---------------------------------------------------------------------------
// Colour helpers — degrade gracefully when not a TTY
// ---------------------------------------------------------------------------
const isTTY = process.stdout.isTTY;
const red = (s) => (isTTY ? styleText("red", s) : s);
const green = (s) => (isTTY ? styleText("green", s) : s);

// ---------------------------------------------------------------------------
// Schema constants
// ---------------------------------------------------------------------------
const VALID_STATUSES = new Set(["stable", "beta", "deprecated"]);
const REQUIRED_H2S = [
  "Purpose",
  "When to use",
  "When NOT to use",
  "Props",
  "Example",
  "i18n keys",
  "Gotchas",
];

// ---------------------------------------------------------------------------
// Schema validator
// ---------------------------------------------------------------------------
/**
 * Validates a sidecar .md file's frontmatter and body shape.
 * Returns an array of human-readable error strings (empty = valid).
 *
 * @param {string} mdPath       - Absolute path to the .md file
 * @param {string} expectedName - Basename of the file without extension (e.g. "Button")
 * @returns {string[]}
 */
function validateSidecar(mdPath, expectedName) {
  /** @type {string[]} */
  const errors = [];
  const label = relative(process.cwd(), mdPath);

  let parsed;
  try {
    parsed = matter(readFileSync(mdPath, "utf8"));
  } catch (e) {
    errors.push(`${label}: could not parse frontmatter — ${e.message}`);
    return errors;
  }

  const data = parsed.data;

  // --- component ---
  if (typeof data.component !== "string" || data.component.trim() === "") {
    errors.push(`${label}: missing required frontmatter key "component"`);
  } else if (data.component !== expectedName) {
    errors.push(
      `${label}: component mismatch — frontmatter says "${data.component}" but file is "${expectedName}.md"`,
    );
  }

  // --- oneLiner ---
  if (typeof data.oneLiner !== "string" || data.oneLiner.trim() === "") {
    errors.push(`${label}: missing required frontmatter key "oneLiner"`);
  } else if (data.oneLiner.length > 80) {
    errors.push(
      `${label}: oneLiner exceeds 80 characters (${data.oneLiner.length})`,
    );
  }

  // --- status ---
  if (!VALID_STATUSES.has(data.status)) {
    errors.push(
      `${label}: invalid status "${data.status}" — must be one of: stable, beta, deprecated`,
    );
  }

  // --- tags ---
  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    errors.push(`${label}: "tags" must be a non-empty array of strings`);
  }

  // --- Body H2 sections ---
  const body = parsed.content;
  const h2Matches = [...body.matchAll(/^## (.+)$/gm)];
  const foundH2s = h2Matches.map((m) => m[1].trim());

  if (foundH2s.length !== REQUIRED_H2S.length) {
    // Report which are missing or extra
    const missing = REQUIRED_H2S.filter((h) => !foundH2s.includes(h));
    const extra = foundH2s.filter((h) => !REQUIRED_H2S.includes(h));
    for (const h of missing) {
      errors.push(`${label}: missing required H2 section "## ${h}"`);
    }
    for (const h of extra) {
      errors.push(
        `${label}: disallowed H2 section "## ${h}" — only the seven canonical sections are allowed`,
      );
    }
  } else {
    // Same count — check order and exact names
    for (let i = 0; i < REQUIRED_H2S.length; i++) {
      if (foundH2s[i] !== REQUIRED_H2S[i]) {
        errors.push(
          `${label}: H2 sections are out of order or misnamed — ` +
            `expected "${REQUIRED_H2S[i]}" at position ${i + 1}, found "${foundH2s[i]}"`,
        );
        break; // first mismatch is enough to diagnose
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Walk the root directory recursively, collecting .astro and .md files
// ---------------------------------------------------------------------------
/** @type {Set<string>} basename-without-extension, keyed by their full dir path as "dir::name" */
const componentKeys = new Set();
const docKeys = new Set();

/**
 * Maps a unique key to its full file path for error messages.
 * @type {Map<string, string>}
 */
const componentPaths = new Map();
const docPaths = new Map();

/**
 * Recurse into dir, recording .astro and .md entries.
 * Skips CLAUDE.md (project-level file, not a sidecar).
 * @param {string} dir
 */
function walk(dir) {
  if (!existsSync(dir)) return;

  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (entry.endsWith(".astro")) {
      const name = entry.slice(0, -".astro".length);
      const key = `${dir}::${name}`;
      componentKeys.add(key);
      componentPaths.set(key, fullPath);
    } else if (entry.endsWith(".md") && entry !== "CLAUDE.md") {
      const name = entry.slice(0, -".md".length);
      const key = `${dir}::${name}`;
      docKeys.add(key);
      docPaths.set(key, fullPath);
    }
  }
}

walk(root);

// ---------------------------------------------------------------------------
// Compute coverage gaps
// ---------------------------------------------------------------------------
/** @type {string[]} */
const missing = [];
for (const key of componentKeys) {
  if (!docKeys.has(key)) {
    missing.push(componentPaths.get(key).replace(/\.astro$/, ".md"));
  }
}
missing.sort();

/** @type {string[]} */
const orphans = [];
for (const key of docKeys) {
  if (!componentKeys.has(key)) {
    orphans.push(docPaths.get(key));
  }
}
orphans.sort();

// ---------------------------------------------------------------------------
// Report coverage
// ---------------------------------------------------------------------------
const total = componentKeys.size;

if (missing.length > 0 || orphans.length > 0) {
  for (const p of missing) {
    process.stderr.write(
      `${red("ERROR")} missing sidecar: ${relative(process.cwd(), p)}\n`,
    );
  }
  for (const p of orphans) {
    process.stderr.write(
      `${red("ERROR")} orphan sidecar: ${relative(process.cwd(), p)}\n`,
    );
  }

  const missingCount = missing.length;
  const orphanCount = orphans.length;
  const parts = [];
  if (missingCount > 0) parts.push(`${missingCount} missing sidecar(s)`);
  if (orphanCount > 0) parts.push(`${orphanCount} orphan(s)`);
  process.stderr.write(
    `\ncomponent docs: ${parts.join(", ")} (${total} components scanned)\n`,
  );

  process.exit(1);
}

// ---------------------------------------------------------------------------
// Schema validation — only runs if coverage passed
// ---------------------------------------------------------------------------
/** @type {string[]} */
const schemaErrors = [];

for (const key of docKeys) {
  const mdPath = docPaths.get(key);
  const name = basename(mdPath, ".md");
  const fileErrors = validateSidecar(mdPath, name);
  schemaErrors.push(...fileErrors);
}

if (schemaErrors.length > 0) {
  for (const msg of schemaErrors) {
    process.stderr.write(`${red("ERROR")} ${msg}\n`);
  }
  process.stderr.write(
    `\ncomponent docs: ${schemaErrors.length} schema error(s) (${total} components scanned)\n`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// All checks passed
// ---------------------------------------------------------------------------
process.stdout.write(green(`component docs: ${total} components OK\n`));
process.exit(0);
