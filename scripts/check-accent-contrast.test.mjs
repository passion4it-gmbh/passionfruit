#!/usr/bin/env node
/**
 * Tests for scripts/check-accent-contrast.mjs
 * Runner: pnpm exec node --test scripts/check-accent-contrast.test.mjs
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SCRIPT = new URL("../scripts/check-accent-contrast.mjs", import.meta.url)
  .pathname;

describe("check-accent-contrast", () => {
  let dir;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), "accent-"));
  });

  after(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function run(value) {
    const css = join(dir, "global.css");
    writeFileSync(css, `@theme {\n  --color-accent: ${value};\n}\n`);
    return spawnSync("node", [SCRIPT, `--css=${css}`], { encoding: "utf8" });
  }

  it("passes a colour at or above 4.5:1", () => {
    assert.equal(run("#6265f0").status, 0);
  });

  it("fails just below 4.5:1", () => {
    assert.equal(run("#6366f1").status, 1);
  });

  it("prints a shade that itself passes", () => {
    const { stdout, status } = run("#f59e0b");
    assert.equal(status, 1);
    const shade = stdout.match(/Nearest passing shade: (#[0-9a-f]{6})/)?.[1];
    assert.ok(shade, stdout);
    assert.equal(run(shade).status, 0);
  });

  it("fails when the accent isn't a 6-digit hex value", () => {
    const { stdout, status } = run("oklch(0.6 0.2 270)");
    assert.equal(status, 1);
    assert.match(stdout, /6-digit hex/);
  });
});
