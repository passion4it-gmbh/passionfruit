#!/usr/bin/env node
/**
 * Postbuild: inject CSP reporting endpoint into dist/_headers.
 *
 * `public/_headers` is the source of truth, copied verbatim into dist/ by
 * astro build. This script optionally adds Reporting-Endpoints + report-uri
 * + report-to directives that point at PostHog's /report/ ingest.
 *
 * No-op when PUBLIC_POSTHOG_API_KEY is unset — the template ships with
 * reporting disabled, and each downstream project opts in by setting the
 * env var (already required for PostHog analytics to load anyway).
 *
 * Usage:
 *   node --env-file-if-exists=.env scripts/postbuild-headers.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const HEADERS_PATH = join(process.cwd(), "dist", "_headers");

if (!existsSync(HEADERS_PATH)) {
  console.warn(
    "[headers] dist/_headers not found — skipping (run after `astro build`)",
  );
  process.exit(0);
}

const key = process.env.PUBLIC_POSTHOG_API_KEY;
if (!key) {
  console.log(
    "[headers] PUBLIC_POSTHOG_API_KEY unset — CSP reporting disabled",
  );
  process.exit(0);
}

const host = (
  process.env.PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com"
).replace(/\/$/, "");
// v=1 lets you correlate violation reports to a specific CSP version. Bump
// when you materially change the policy so historical noise doesn't drown
// out new regressions.
const reportUrl = `${host}/report/?token=${encodeURIComponent(key)}&v=1`;

const original = readFileSync(HEADERS_PATH, "utf8");

if (original.includes("report-uri ")) {
  console.log("[headers] reporting already injected — skipping");
  process.exit(0);
}

const cspLineRegex = /^(\s*)Content-Security-Policy:(.*)$/m;
const match = original.match(cspLineRegex);
if (!match) {
  console.error(
    "[headers] could not locate Content-Security-Policy line in dist/_headers",
  );
  process.exit(1);
}

const [, indent, cspValue] = match;
const reportingHeader = `${indent}Reporting-Endpoints: csp-endpoint="${reportUrl}"`;
const extendedCsp = `${indent}Content-Security-Policy:${cspValue}; report-uri ${reportUrl}; report-to csp-endpoint`;

const next = original.replace(
  cspLineRegex,
  `${reportingHeader}\n${extendedCsp}`,
);

writeFileSync(HEADERS_PATH, next);
console.log(`[headers] CSP reporting → ${host}/report/`);
