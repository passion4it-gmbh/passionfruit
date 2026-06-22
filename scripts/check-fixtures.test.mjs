#!/usr/bin/env node
/**
 * Tests for scripts/check-fixtures.mjs
 * Runner: pnpm exec node --test scripts/check-fixtures.test.mjs
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";

const SCRIPT = new URL("../scripts/check-fixtures.mjs", import.meta.url)
  .pathname;

// A brand literal baked into code — the thing the check must catch.
const BRAND = 'const org = "Greenleaf Digital";\n';
// The correct, i18n-derived form — must always pass.
const CLEAN = 'const org = t("site.name");\n';

/** Write `contents` to `relPath` under `rootDir`, creating parent dirs. */
function seed(rootDir, relPath, contents) {
  const abs = join(rootDir, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, contents);
}

function run(rootDir) {
  return spawnSync("node", [SCRIPT, `--root=${rootDir}`], { encoding: "utf8" });
}

function withRoot(seedFn, assertFn) {
  let dir;
  before(() => {
    dir = mkdtempSync(join(tmpdir(), "fixtures-test-"));
    seedFn(dir);
  });
  after(() => rmSync(dir, { recursive: true, force: true }));
  assertFn(() => dir);
}

// ---------------------------------------------------------------------------
describe("clean code tree", () => {
  withRoot(
    (d) => {
      seed(d, "components/Header.astro", CLEAN);
      seed(d, "lib/structured-data.ts", CLEAN);
    },
    (root) => {
      it("exits 0", () => assert.equal(run(root()).status, 0));
    },
  );
});

// ---------------------------------------------------------------------------
describe("brand leaked into shipped code", () => {
  withRoot(
    (d) => seed(d, "lib/structured-data.ts", BRAND),
    (root) => {
      it("exits 1", () => assert.equal(run(root()).status, 1));
      it("names the offending file", () => {
        assert.match(run(root()).stdout, /structured-data\.ts/);
      });
    },
  );
});

// ---------------------------------------------------------------------------
describe("brand allowed in replaceable fixtures", () => {
  withRoot(
    (d) => {
      seed(d, "i18n/de.json", `{ "site": { "name": "Greenleaf Digital" } }`);
      seed(d, "data/testimonials.ts", BRAND);
      seed(d, "content/blog/en/post.md", "# Greenleaf Digital");
    },
    (root) => {
      it("exits 0", () => assert.equal(run(root()).status, 0));
    },
  );
});

// ---------------------------------------------------------------------------
describe("brand allowed in the dev-only design-floor showcase", () => {
  withRoot(
    (d) => seed(d, "pages/design-floor/sections.astro", BRAND),
    (root) => {
      it("exits 0", () => assert.equal(run(root()).status, 0));
    },
  );
});

// ---------------------------------------------------------------------------
describe("non-code files are not scanned", () => {
  withRoot(
    (d) =>
      seed(d, "components/Footer.md", "| copyright | © Greenleaf Digital |"),
    (root) => {
      it("exits 0", () => assert.equal(run(root()).status, 0));
    },
  );
});
