#!/usr/bin/env tsx
/**
 * CLI orchestrator for the OG image generator.
 *
 * Loads site data (per locale) from the project, renders the OG template via
 * Satori + resvg, and writes `og-default-${lang}.png` files into `outDir`.
 *
 * Usage:
 *   tsx scripts/generate-og.ts [options]
 *
 * Options:
 *   --lang <de|en>          Regenerate only the given locale (default: both)
 *   --out-dir <path>        Output directory (default: ${projectRoot}/public)
 *   --project-root <path>   Project root to read from (default: process.cwd())
 *   --help, -h              Show this help and exit
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { SatoriOptions } from "satori";

import {
  type Locale,
  type GlobalAssets,
  type SiteText,
  OgDiscoverError,
  loadGlobalAssets,
  loadSiteText,
} from "./og-discover.ts";
import { renderOg } from "./og-render.ts";

const LOCALES: readonly Locale[] = ["de", "en"];

const KNOWN_FLAGS: ReadonlySet<string> = new Set([
  "--lang",
  "--out-dir",
  "--project-root",
]);

interface Args {
  lang: Locale | null;
  outDir: string | null;
  projectRoot: string | null;
}

function printUsage(stream: NodeJS.WritableStream): void {
  stream.write(`Usage: tsx scripts/generate-og.ts [options]

Options:
  --lang <de|en>          Regenerate only the given locale (default: both)
  --out-dir <path>        Output directory (default: \${projectRoot}/public)
  --project-root <path>   Project root to read from (default: process.cwd())
  --help, -h              Show this help and exit
`);
}

/**
 * Parse argv. Returns:
 *   - { ok: true, args } on a valid parse,
 *   - { ok: false, help: true } when `--help` / `-h` was passed,
 *   - { ok: false, help: false, message } on a parse error.
 */
type ParseResult =
  | { ok: true; args: Args }
  | { ok: false; help: true }
  | { ok: false; help: false; message: string };

function parseArgs(argv: string[]): ParseResult {
  const args: Args = { lang: null, outDir: null, projectRoot: null };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      return { ok: false, help: true };
    }

    if (arg === "--lang") {
      const value = argv[i + 1];
      if (value === undefined) {
        return {
          ok: false,
          help: false,
          message: "Missing value for --lang (expected: de or en)",
        };
      }
      if (value !== "de" && value !== "en") {
        return {
          ok: false,
          help: false,
          message: `Invalid value for --lang: "${value}" (accepted: de, en)`,
        };
      }
      args.lang = value;
      i += 2;
      continue;
    }

    if (arg === "--out-dir") {
      const value = argv[i + 1];
      if (value === undefined) {
        return {
          ok: false,
          help: false,
          message: "Missing value for --out-dir",
        };
      }
      args.outDir = value;
      i += 2;
      continue;
    }

    if (arg === "--project-root") {
      const value = argv[i + 1];
      if (value === undefined) {
        return {
          ok: false,
          help: false,
          message: "Missing value for --project-root",
        };
      }
      args.projectRoot = value;
      i += 2;
      continue;
    }

    // `--known-flag=value` not supported — generate-image.ts also doesn't, and
    // a clear hint beats a generic "unknown option". Only suggest the
    // corrected syntax when `key` is one of the flags we actually accept;
    // otherwise the hint would falsely advertise unrelated unknown options.
    if (arg.startsWith("--") && arg.includes("=")) {
      const [key] = arg.split("=", 1);
      if (KNOWN_FLAGS.has(key)) {
        return {
          ok: false,
          help: false,
          message: `Unknown option: ${arg} (use "${key} <value>" — "=" syntax is not supported)`,
        };
      }
    }

    return {
      ok: false,
      help: false,
      message: `Unknown option: ${arg}`,
    };
  }

  return { ok: true, args };
}

function loadFonts(projectRoot: string): SatoriOptions["fonts"] {
  const baseDir = join(
    projectRoot,
    "node_modules",
    "@fontsource",
    "inter",
    "files",
  );

  const weights: Array<{ weight: 400 | 700; file: string }> = [
    { weight: 400, file: "inter-latin-400-normal.woff" },
    { weight: 700, file: "inter-latin-700-normal.woff" },
  ];

  return weights.map(({ weight, file }) => {
    const path = join(baseDir, file);
    let data: Buffer;
    try {
      data = readFileSync(path);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Cannot read Inter font at ${path}: ${reason}\n` +
          `Run \`pnpm install\` to fetch @fontsource/inter.`,
      );
    }
    return {
      name: "Inter",
      data,
      weight,
      style: "normal" as const,
    };
  });
}

async function main(argv: string[]): Promise<number> {
  const parsed = parseArgs(argv);
  if (parsed.ok === false) {
    if (parsed.help) {
      printUsage(process.stdout);
      return 0;
    }
    process.stderr.write(`${parsed.message}\n`);
    printUsage(process.stderr);
    return 1;
  }

  const projectRoot = resolve(parsed.args.projectRoot ?? process.cwd());
  const outDir = resolve(parsed.args.outDir ?? join(projectRoot, "public"));
  const locales: readonly Locale[] = parsed.args.lang
    ? [parsed.args.lang]
    : LOCALES;

  let fonts: SatoriOptions["fonts"];
  try {
    fonts = loadFonts(projectRoot);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    return 1;
  }

  // Load globals once — same accent / surface / text / favicon for every locale.
  // Resolving here (before the per-locale loop) means any [warn] from a bad
  // colour token fires exactly once, not once per locale.
  let globals: GlobalAssets;
  try {
    globals = loadGlobalAssets(projectRoot);
  } catch (err) {
    if (err instanceof OgDiscoverError) {
      process.stderr.write(`${err.message}\n`);
      return 1;
    }
    throw err;
  }

  // Resolve all per-locale text up-front so a discovery failure in one locale
  // aborts before any file is written (no partial outputs).
  const bundles: Array<{ lang: Locale; text: SiteText }> = [];
  for (const lang of locales) {
    try {
      bundles.push({ lang, text: loadSiteText(projectRoot, lang) });
    } catch (err) {
      if (err instanceof OgDiscoverError) {
        process.stderr.write(`${err.message}\n`);
        return 1;
      }
      throw err;
    }
  }

  mkdirSync(outDir, { recursive: true });

  for (const { lang, text } of bundles) {
    const buffer = await renderOg({
      props: { ...globals, ...text, lang },
      fonts,
    });
    const filename = `og-default-${lang}.png`;
    writeFileSync(join(outDir, filename), buffer);
    process.stdout.write(`Wrote ${filename} (${buffer.byteLength} bytes)\n`);
  }

  return 0;
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  });
