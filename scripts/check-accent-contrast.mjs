#!/usr/bin/env node
/**
 * Accent contrast check for the passionfruit template.
 *
 * `--color-accent` is used both as a background under white text (`bg-accent`)
 * and as text on white (`text-accent`). Both pairings have the same contrast
 * ratio, so one rule covers them: the accent must reach WCAG AA (4.5:1) on
 * white. On failure the nearest passing shade is printed, which is what
 * `/onboard` uses when a brand colour is too light.
 *
 * Exits 0 on success, 1 if the accent fails or isn't a 6-digit hex value.
 *
 * Usage:
 *   node scripts/check-accent-contrast.mjs [--css=<path>]
 *
 * --css defaults to ./src/styles/global.css
 */

import { readFileSync } from "node:fs";
import { styleText } from "node:util";

const MIN_RATIO = 4.5;

const cssArg = process.argv.find((a) => a.startsWith("--css="));
const cssPath = cssArg
  ? cssArg.slice("--css=".length)
  : "./src/styles/global.css";

const isTTY = process.stdout.isTTY;
const red = (s) => (isTTY ? styleText("red", s) : s);
const green = (s) => (isTTY ? styleText("green", s) : s);

/** @param {string} hex */
const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** @param {number[]} rgb */
const toHex = (rgb) =>
  "#" + rgb.map((c) => Math.floor(c).toString(16).padStart(2, "0")).join("");

/** @param {number} channel */
const linear = (channel) => {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** Contrast of a colour against white. @param {number[]} rgb */
function ratioOnWhite(rgb) {
  const [r, g, b] = rgb.map(linear);
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
}

/** Darken in small steps until the colour passes. @param {number[]} rgb */
function nearestPassing(rgb) {
  for (let k = 1; k > 0; k -= 0.002) {
    const candidate = toRgb(toHex(rgb.map((c) => c * k)));
    if (ratioOnWhite(candidate) >= MIN_RATIO) return toHex(candidate);
  }
  return "#000000";
}

const accent = readFileSync(cssPath, "utf8").match(
  /--color-accent:\s*(#[0-9a-fA-F]{6})\s*;/,
)?.[1];

if (!accent) {
  console.log(
    red("Accent check failed:") +
      ` --color-accent in ${cssPath} must be a 6-digit hex value`,
  );
  process.exit(1);
}

const rgb = toRgb(accent);
const ratio = ratioOnWhite(rgb);

if (ratio < MIN_RATIO) {
  console.log(
    red("Accent check failed:") +
      ` ${accent} is ${ratio.toFixed(2)}:1 on white, needs ${MIN_RATIO}:1`,
  );
  console.log(`Nearest passing shade: ${nearestPassing(rgb)}`);
  console.log(
    "Use it as --color-accent and keep the original as --color-accent-glow.",
  );
  process.exit(1);
}

console.log(green(`accent check: ${accent} is ${ratio.toFixed(2)}:1 on white`));
