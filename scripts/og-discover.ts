/**
 * Project-data discovery layer for the OG image generator.
 *
 * Splits into two reads:
 *  - `loadGlobalAssets(projectRoot)` — accent + dark-surface + on-dark text
 *    colors (from `global.css`) and the favicon SVG. Runs once per CLI invocation.
 *  - `loadSiteText(projectRoot, lang)` — `site.name` + `site.tagline` from the
 *    locale's i18n JSON. Runs once per locale.
 *
 * The split exists so the CLI can hoist global asset reads out of the
 * per-locale loop — without it, a malformed `--color-*` value would emit its
 * `[warn]` line twice.
 *
 * Synchronous, ESM, no `any`, no top-level side effects.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Locale = "de" | "en";

export interface GlobalAssets {
  /** Accent colour pulled from `--color-accent` in `global.css`. */
  accent: string;
  /** Dark surface colour pulled from `--color-surface-dark`. */
  surface: string;
  /** On-dark text colour pulled from `--color-text-on-dark`. */
  textOnDark: string;
  /** Raw contents of `public/favicon.svg`. */
  logoSvg: string;
  /**
   * `data:image/png;base64,…` URI for the optional art-directed background
   * image at `src/assets/og/bg.png`. `null` when the file is absent — the
   * template falls back to the flat surface + radial accent glow.
   */
  bgImageDataUri: string | null;
}

export interface SiteText {
  name: string;
  tagline: string;
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

const DEFAULTS = {
  accent: "#6366f1",
  surface: "#0c0c1d",
  textOnDark: "#f0f0f5",
} as const;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

interface I18nShape {
  site?: {
    name?: unknown;
    tagline?: unknown;
  };
}

function readFileOrThrow(path: string, label: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new OgDiscoverError(`Cannot read ${label} at ${path}: ${reason}`);
  }
}

/**
 * Pull a `--<token>: <value>;` declaration out of a CSS string. Returns the
 * value if it is a strict `#rrggbb` literal; otherwise emits a single `[warn]`
 * line to stderr and returns `fallback`.
 */
function readColorToken(
  css: string,
  cssPath: string,
  token: string,
  fallback: string,
): string {
  const decl = new RegExp(`--${token}:\\s*(.*?);`);
  const match = css.match(decl);
  if (!match) {
    process.stderr.write(
      `[warn] og-discover: no --${token} declaration in ${cssPath}, falling back to ${fallback}\n`,
    );
    return fallback;
  }

  const value = match[1].trim();
  if (!HEX_RE.test(value)) {
    process.stderr.write(
      `[warn] og-discover: --${token} value "${value}" in ${cssPath} is not a #rrggbb hex literal, falling back to ${fallback}\n`,
    );
    return fallback;
  }

  return value;
}

/**
 * Read the locale-independent assets (brand colours + favicon). Call once
 * per CLI invocation, not per locale.
 */
export function loadGlobalAssets(projectRoot: string): GlobalAssets {
  const cssPath = join(projectRoot, "src", "styles", "global.css");
  const css = readFileOrThrow(cssPath, "CSS file");

  const accent = readColorToken(css, cssPath, "color-accent", DEFAULTS.accent);
  const surface = readColorToken(
    css,
    cssPath,
    "color-surface-dark",
    DEFAULTS.surface,
  );
  const textOnDark = readColorToken(
    css,
    cssPath,
    "color-text-on-dark",
    DEFAULTS.textOnDark,
  );

  const logoPath = join(projectRoot, "public", "favicon.svg");
  const logoSvg = readFileOrThrow(logoPath, "favicon");

  // Optional art-directed background. Absent file is the no-bg default — only
  // a hard read failure (permissions, truncated bytes) escalates to an error.
  const bgPath = join(projectRoot, "src", "assets", "og", "bg.png");
  let bgImageDataUri: string | null = null;
  if (existsSync(bgPath)) {
    let buffer: Buffer;
    try {
      buffer = readFileSync(bgPath);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new OgDiscoverError(`Cannot read bg image at ${bgPath}: ${reason}`);
    }
    bgImageDataUri = `data:image/png;base64,${buffer.toString("base64")}`;
  }

  return { accent, surface, textOnDark, logoSvg, bgImageDataUri };
}

/**
 * Read the locale-specific site text. Throws `OgDiscoverError` if the file
 * is missing or required keys are absent/wrong-typed.
 */
export function loadSiteText(projectRoot: string, lang: Locale): SiteText {
  const path = join(projectRoot, "src", "i18n", `${lang}.json`);
  const raw = readFileOrThrow(path, "i18n file");

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
