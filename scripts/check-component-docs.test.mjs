#!/usr/bin/env node
/**
 * TDD tests for scripts/check-component-docs.mjs
 * Runner: pnpm exec node --test scripts/check-component-docs.test.mjs
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SCRIPT = new URL("../scripts/check-component-docs.mjs", import.meta.url)
  .pathname;

/**
 * Seeds a component file and optionally a sibling sidecar .md.
 * @param {string} rootDir  - tmp root (acts as src/components)
 * @param {string} name     - component name without extension (may include subdir, e.g. "pages/about")
 * @param {{ withDoc?: boolean; frontmatter?: string; body?: string }} [options]
 */
function seedComponent(rootDir, name, options = {}) {
  const parts = name.split("/");
  const base = parts[parts.length - 1];
  const subdir = parts.slice(0, -1).join("/");
  const dir = subdir ? join(rootDir, subdir) : rootDir;
  mkdirSync(dir, { recursive: true });

  writeFileSync(join(dir, `${base}.astro`), `---\n---\n<div />`);

  if (options.withDoc) {
    const frontmatter =
      options.frontmatter ??
      `---\ntitle: "${base}"\ndescription: "A component."\n---\n`;
    const body = options.body ?? "## Overview\nDoes things.";
    writeFileSync(join(dir, `${base}.md`), frontmatter + body);
  }
}

/**
 * Runs the check-component-docs script against the given rootDir.
 * @param {string} rootDir
 * @param {...string} extraArgs
 * @returns {{ status: number, stdout: string, stderr: string }}
 */
function runScript(rootDir, ...extraArgs) {
  const result = spawnSync(
    "node",
    [SCRIPT, `--root=${rootDir}`, ...extraArgs],
    { encoding: "utf8" },
  );
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

// ---------------------------------------------------------------------------
// 1. Empty components dir exits 0
// ---------------------------------------------------------------------------
describe("empty components dir", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-test-"));
    // No files at all — just the empty dir itself
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 0", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });

  it("stdout mentions 0 components", () => {
    const result = runScript(tmpDir);
    assert.match(result.stdout, /component docs: 0 components/i);
  });
});

// ---------------------------------------------------------------------------
// 2. All components have sidecars exits 0
// ---------------------------------------------------------------------------
describe("all components have sidecars", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-test-"));
    seedComponent(tmpDir, "Button", { withDoc: true });
    seedComponent(tmpDir, "Header", { withDoc: true });
    seedComponent(tmpDir, "Footer", { withDoc: true });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 0", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });
});

// ---------------------------------------------------------------------------
// 3. One missing sidecar exits 1, stderr names the missing path
// ---------------------------------------------------------------------------
describe("one missing sidecar", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-test-"));
    seedComponent(tmpDir, "Button", { withDoc: true });
    seedComponent(tmpDir, "Header"); // no doc
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr names the missing path", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Header\.md/);
  });
});

// ---------------------------------------------------------------------------
// 4. Two missing sidecars list both in stderr
// ---------------------------------------------------------------------------
describe("three missing sidecars", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-test-"));
    seedComponent(tmpDir, "Alpha"); // no doc
    seedComponent(tmpDir, "Beta"); // no doc
    seedComponent(tmpDir, "Gamma"); // no doc
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr lists all three missing paths", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Alpha\.md/);
    assert.match(result.stderr, /Beta\.md/);
    assert.match(result.stderr, /Gamma\.md/);
  });
});

// ---------------------------------------------------------------------------
// 5. Orphan sidecar (no matching .astro) exits 1, stderr names the orphan
// ---------------------------------------------------------------------------
describe("orphan sidecar without matching component", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-test-"));
    seedComponent(tmpDir, "Real", { withDoc: true });
    // Write an .md with no matching .astro
    writeFileSync(
      join(tmpDir, "Orphan.md"),
      "---\ntitle: Orphan\n---\nNo component.",
    );
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr names the orphan", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Orphan\.md/);
  });
});

// ---------------------------------------------------------------------------
// 6. CLAUDE.md is not treated as a sidecar
// ---------------------------------------------------------------------------
describe("CLAUDE.md is not treated as a sidecar", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-test-"));
    seedComponent(tmpDir, "Alpha", { withDoc: true });
    writeFileSync(join(tmpDir, "CLAUDE.md"), "# Project notes\nNot a sidecar.");
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 0 (CLAUDE.md is not flagged as an orphan)", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });

  it("success summary counts only 1 component, not 2", () => {
    const result = runScript(tmpDir);
    assert.match(result.stdout, /component docs: 1 components/i);
  });
});

// ---------------------------------------------------------------------------
// 7. Recurses into subdirectories
// ---------------------------------------------------------------------------
describe("recursion into subdirectories", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-test-"));
    seedComponent(tmpDir, "Foo", { withDoc: true });
    seedComponent(tmpDir, "pages/about", { withDoc: true });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 0", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });
});
