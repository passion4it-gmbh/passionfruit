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

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
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
// Report
// ---------------------------------------------------------------------------
const total = componentKeys.size;

if (missing.length === 0 && orphans.length === 0) {
  process.stdout.write(green(`component docs: ${total} components OK\n`));
  process.exit(0);
}

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
