/**
 * Project-data discovery layer for the OG image generator.
 *
 * Reads three project artifacts synchronously and returns a narrow
 * SiteData shape that downstream layers (template, renderer, CLI) can rely on.
 *
 * No top-level side effects. No async. No `any`.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Locale = "de" | "en";

export interface SiteData {
  name: string;
  tagline: string;
  accent: string;
  logoSvg: string;
}

/**
 * Discriminator error so callers can distinguish discovery failures
 * (missing files, malformed i18n) from other thrown errors.
 */
export class OgDiscoverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OgDiscoverError";
  }
}

const DEFAULT_ACCENT = "#6366f1";
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
// Match the first `--color-accent: <value>;` declaration anywhere in the file.
// Non-greedy capture between the colon and the semicolon.
const ACCENT_DECL_RE = /--color-accent:\s*(.*?);/;

interface I18nShape {
  site?: {
    name?: unknown;
    tagline?: unknown;
  };
}

function readSiteI18n(
  projectRoot: string,
  lang: Locale,
): {
  name: string;
  tagline: string;
} {
  const path = join(projectRoot, "src", "i18n", `${lang}.json`);

  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new OgDiscoverError(`Cannot read i18n file at ${path}: ${reason}`);
  }

  let parsed: I18nShape;
  try {
    parsed = JSON.parse(raw) as I18nShape;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new OgDiscoverError(`Cannot parse JSON at ${path}: ${reason}`);
  }

  const name = parsed.site?.name;
  if (typeof name !== "string") {
    throw new OgDiscoverError(
      `Missing required key "site.name" (expected string) in ${path}`,
    );
  }

  const tagline = parsed.site?.tagline;
  if (typeof tagline !== "string") {
    throw new OgDiscoverError(
      `Missing required key "site.tagline" (expected string) in ${path}`,
    );
  }

  return { name, tagline };
}

function readAccent(projectRoot: string): string {
  const path = join(projectRoot, "src", "styles", "global.css");

  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new OgDiscoverError(`Cannot read CSS file at ${path}: ${reason}`);
  }

  const match = raw.match(ACCENT_DECL_RE);
  if (!match) {
    process.stderr.write(
      `[warn] og-discover: no --color-accent declaration in ${path}, falling back to ${DEFAULT_ACCENT}\n`,
    );
    return DEFAULT_ACCENT;
  }

  const value = match[1].trim();
  if (!HEX_RE.test(value)) {
    process.stderr.write(
      `[warn] og-discover: --color-accent value "${value}" in ${path} is not a #rrggbb hex literal, falling back to ${DEFAULT_ACCENT}\n`,
    );
    return DEFAULT_ACCENT;
  }

  return value;
}

function readLogo(projectRoot: string): string {
  const path = join(projectRoot, "public", "favicon.svg");
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new OgDiscoverError(`Cannot read favicon at ${path}: ${reason}`);
  }
}

/**
 * Load the SiteData bundle for a given locale, rooted at `projectRoot`.
 *
 * Throws `OgDiscoverError` for missing/unreadable files and for missing
 * required i18n keys. Falls back to a default accent (with a `[warn]` line
 * on stderr) when the CSS declaration is absent or malformed.
 */
export function loadSiteData(projectRoot: string, lang: Locale): SiteData {
  const { name, tagline } = readSiteI18n(projectRoot, lang);
  const accent = readAccent(projectRoot);
  const logoSvg = readLogo(projectRoot);
  return { name, tagline, accent, logoSvg };
}
