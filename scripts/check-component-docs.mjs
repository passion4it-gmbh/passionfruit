#!/usr/bin/env node
/**
 * Component sidecar documentation coverage check + catalog regeneration.
 *
 * Three responsibilities, in order:
 *   1. Coverage check — every .astro must have a sibling .md sidecar.
 *   2. Schema check  — validate frontmatter keys, oneLiner length, status
 *                      enum, and the seven required H2 sections.
 *   3. Catalog sync  — regenerate the <!-- CATALOG:START --> / <!-- CATALOG:END -->
 *                      block in <root>/CLAUDE.md from validated sidecar frontmatter.
 *
 * Usage:
 *   node scripts/check-component-docs.mjs [--root=<path>] [--strict]
 *
 * Exit codes:
 *   0 — all checks pass, catalog in sync (or updated in local mode)
 *   1 — missing sidecars, schema errors, or catalog drift (in CI/strict mode)
 *
 * --root defaults to ./src/components
 * --strict forces CI behavior (fail on catalog drift) regardless of $CI env var
 *
 * Catalog behavior:
 *   - Local mode ($CI unset, --strict absent): catalog drift → write file in
 *     place, exit 0. Acts as an autoformatter.
 *   - CI / strict mode ($CI set or --strict): catalog drift → print diff,
 *     print "Run pnpm sync:component-catalog locally and commit.", exit 1.
 *     File on disk is NOT modified.
 *
 * Trailing newline policy: the catalog block is always appended with a
 * leading "\n\n" when no markers exist. When markers exist, the region
 * between them is replaced verbatim. The file's trailing newline after
 * <!-- CATALOG:END --> is always a single "\n".
 *
 * Multi-tag components: the first tag is used for grouping. Subsequent tags
 * are ignored for catalog placement (deferred-pain choice from the spec).
 */

import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import matter from "gray-matter";
import { styleText } from "node:util";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const rootArg = process.argv.find((a) => a.startsWith("--root="));
const root = rootArg ? rootArg.slice("--root=".length) : "./src/components";
const strictMode = process.argv.includes("--strict");
const ciMode = strictMode || Boolean(process.env.CI);

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
 * @typedef {{ path: string, name: string, status: string, oneLiner: string, tags: string[] }} SidecarInfo
 */

/**
 * Validates a sidecar .md file's frontmatter and body shape.
 * Returns an object with errors (empty array = valid) and, when valid, the
 * parsed sidecar info needed for catalog generation.
 *
 * @param {string} mdPath       - Absolute path to the .md file
 * @param {string} expectedName - Basename of the file without extension (e.g. "Button")
 * @returns {{ errors: string[], info: SidecarInfo | null }}
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
    return { errors, info: null };
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

  /** @type {SidecarInfo | null} */
  const info =
    errors.length === 0
      ? {
          path: mdPath,
          name: data.component,
          status: data.status,
          oneLiner: data.oneLiner,
          tags: data.tags,
        }
      : null;

  return { errors, info };
}

// ---------------------------------------------------------------------------
// Catalog generator
// ---------------------------------------------------------------------------

const CATALOG_START = "<!-- CATALOG:START -->";
const CATALOG_END = "<!-- CATALOG:END -->";

/**
 * Renders the catalog block (including markers) from a list of validated sidecars.
 *
 * Grouping: by the first tag in `tags`. Tags sorted alphabetically. Within each
 * group, components sorted alphabetically by name.
 *
 * Link format: relative from the CLAUDE.md directory to each sidecar. Always
 * prefixed with "./" for markdown-link compatibility.
 *
 * @param {SidecarInfo[]} sidecars
 * @param {string} claudeDir - Directory containing CLAUDE.md (used for relative links)
 * @returns {string} — the full block including markers, no trailing newline
 */
function renderCatalogBlock(sidecars, claudeDir) {
  // Group by first tag
  /** @type {Map<string, SidecarInfo[]>} */
  const groups = new Map();
  for (const s of sidecars) {
    const tag = s.tags[0];
    if (!groups.has(tag)) groups.set(tag, []);
    groups.get(tag).push(s);
  }

  // Sort tag names alphabetically; sort components within each group alphabetically
  const sortedTags = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  for (const tag of sortedTags) {
    groups.get(tag).sort((a, b) => a.name.localeCompare(b.name));
  }

  const lines = [
    CATALOG_START,
    "Auto-generated by `scripts/check-component-docs.mjs`. Do not edit between markers.",
    "",
  ];

  for (const tag of sortedTags) {
    lines.push(`### ${tag}`, "");
    lines.push("| Component | Status | One-liner | Docs |");
    lines.push("| --- | --- | --- | --- |");
    for (const s of groups.get(tag)) {
      const rel = relative(claudeDir, s.path);
      // Ensure link starts with "./" for markdown convention
      const link = rel.startsWith(".") ? rel : `./${rel}`;
      const filename = basename(s.path);
      const docsCell = `[${filename}](${link})`;
      lines.push(`| ${s.name} | ${s.status} | ${s.oneLiner} | ${docsCell} |`);
    }
    lines.push("");
  }

  lines.push(CATALOG_END);
  return lines.join("\n");
}

/**
 * Computes current and desired CLAUDE.md content given a catalog block.
 *
 * If markers exist: replace everything from CATALOG:START to CATALOG:END
 * (inclusive) with the new block.
 * If markers do not exist: append "\n\n<block>\n" to the existing content.
 *
 * @param {string} currentContent
 * @param {string} catalogBlock - rendered block including markers
 * @returns {string} — desired file content
 */
function applyBlock(currentContent, catalogBlock) {
  const startIdx = currentContent.indexOf(CATALOG_START);
  const endIdx = currentContent.indexOf(CATALOG_END);

  if (startIdx !== -1 && endIdx !== -1) {
    // Replace the region from CATALOG:START through CATALOG:END
    const before = currentContent.slice(0, startIdx);
    const after = currentContent.slice(endIdx + CATALOG_END.length);
    return `${before}${catalogBlock}${after}`;
  }

  // No markers — append block; omit separator when file is empty
  const trimmed = currentContent.replace(/\n+$/, "");
  const prefix = trimmed ? `${trimmed}\n\n` : "";
  return `${prefix}${catalogBlock}\n`;
}

/**
 * Generates a minimal line-by-line diff string (for CI output).
 * Lines only present in `prev` are prefixed with "-"; only in `next` with "+".
 *
 * @param {string} prev
 * @param {string} next
 * @returns {string}
 */
function minimalDiff(prev, next) {
  const prevLines = prev.split("\n");
  const nextLines = next.split("\n");
  const out = [];

  // Simple approach: find the catalog block region in each and diff it
  const prevStart = prevLines.findIndex((l) => l === CATALOG_START);
  const nextStart = nextLines.findIndex((l) => l === CATALOG_START);
  const prevEnd = prevLines.findIndex((l) => l === CATALOG_END);
  const nextEnd = nextLines.findIndex((l) => l === CATALOG_END);

  // If either has no catalog block, just show the would-be-written lines
  if (nextStart === -1 || nextEnd === -1) {
    return "(no catalog block in desired content — unexpected)";
  }

  if (prevStart === -1 || prevEnd === -1) {
    out.push("(current file has no catalog block)");
    out.push("Would write:");
    for (const l of nextLines.slice(nextStart, nextEnd + 1)) {
      out.push(`+ ${l}`);
    }
    return out.join("\n");
  }

  const prevBlock = prevLines.slice(prevStart, prevEnd + 1);
  const nextBlock = nextLines.slice(nextStart, nextEnd + 1);

  for (const l of prevBlock) {
    if (!nextBlock.includes(l)) out.push(`- ${l}`);
  }
  for (const l of nextBlock) {
    if (!prevBlock.includes(l)) out.push(`+ ${l}`);
  }

  return out.length > 0 ? out.join("\n") : "(no line-level diff)";
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

/** @type {SidecarInfo[]} */
const validSidecars = [];

for (const key of docKeys) {
  const mdPath = docPaths.get(key);
  const name = basename(mdPath, ".md");
  const { errors: fileErrors, info } = validateSidecar(mdPath, name);
  schemaErrors.push(...fileErrors);
  validSidecars.push(info);
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
// Catalog sync — only runs if coverage + schema passed
// ---------------------------------------------------------------------------
const claudeMdPath = join(root, "CLAUDE.md");
const claudeDir = dirname(claudeMdPath);
const catalogBlock = renderCatalogBlock(validSidecars, claudeDir);

let currentContent = "";
if (existsSync(claudeMdPath)) {
  currentContent = readFileSync(claudeMdPath, "utf8");
}

const desiredContent = applyBlock(currentContent, catalogBlock);

if (currentContent === desiredContent) {
  process.stdout.write(green(`component docs: ${total} components OK\n`));
  process.stdout.write("catalog in sync\n");
  process.exit(0);
}

// Catalog is out of date
if (ciMode) {
  const diff = minimalDiff(currentContent, desiredContent);
  process.stderr.write(`catalog drift detected:\n${diff}\n\n`);
  process.stderr.write(`Run pnpm sync:component-catalog locally and commit.\n`);
  process.exit(1);
} else {
  writeFileSync(claudeMdPath, desiredContent, "utf8");
  process.stdout.write(green(`component docs: ${total} components OK\n`));
  process.stdout.write(
    green(`catalog updated: ${relative(process.cwd(), claudeMdPath)}\n`),
  );
  process.exit(0);
}
