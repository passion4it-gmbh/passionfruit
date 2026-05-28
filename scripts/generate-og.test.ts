/**
 * End-to-end tests for scripts/generate-og.ts.
 *
 * Runner: pnpm exec tsx --test scripts/generate-og.test.ts
 *
 * Each test spawns the CLI as a subprocess via tsx and asserts on
 * exit code, stdout, stderr, and (where relevant) on the written PNG.
 *
 * Tests that need to mutate input project artifacts (i18n, css, favicon)
 * stage a fresh tmp project root from `scripts/fixtures/og/*` and symlink
 * the real `node_modules` so the CLI can resolve the Inter font.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HERE = fileURLToPath(new URL(".", import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..");
const CLI_PATH = join(PROJECT_ROOT, "scripts", "generate-og.ts");
const TSX_BIN = join(PROJECT_ROOT, "node_modules", ".bin", "tsx");
const REAL_NODE_MODULES = join(PROJECT_ROOT, "node_modules");
const FIXTURE_ROOT = join(PROJECT_ROOT, "scripts", "fixtures", "og");

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const SPAWN_TIMEOUT_MS = 60_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RunResult = SpawnSyncReturns<string>;

function runCli(args: readonly string[]): RunResult {
  return spawnSync(TSX_BIN, [CLI_PATH, ...args], {
    encoding: "utf8",
    cwd: PROJECT_ROOT,
    timeout: SPAWN_TIMEOUT_MS,
  });
}

function mkTmpOutDir(): string {
  return mkdtempSync(join(tmpdir(), "og-test-out-"));
}

/**
 * Stage a writable copy of scripts/fixtures/og/* into a fresh tmp dir
 * and symlink the real node_modules so the CLI can load the Inter font.
 * Caller is responsible for cleanup via `rmSync`.
 */
function setupFixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "og-test-root-"));
  cpSync(FIXTURE_ROOT, root, { recursive: true });
  symlinkSync(REAL_NODE_MODULES, join(root, "node_modules"), "dir");
  return root;
}

function cleanup(...paths: readonly string[]): void {
  for (const p of paths) {
    rmSync(p, { recursive: true, force: true });
  }
}

interface PngHeader {
  width: number;
  height: number;
  magicOk: boolean;
}

function readPngHeader(filePath: string): PngHeader {
  const buf = readFileSync(filePath);
  const magicOk = buf.subarray(0, 8).equals(PNG_MAGIC);
  // IHDR chunk: 8-byte PNG signature + 8 bytes (length + "IHDR") = offset 16.
  // Width is bytes 16-19 (big-endian uint32), height is bytes 20-23.
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height, magicOk };
}

// ---------------------------------------------------------------------------
// 7.1 — default run writes both locales
// ---------------------------------------------------------------------------

test("7.1 default run writes both locales", () => {
  const outDir = mkTmpOutDir();
  try {
    const result = runCli(["--out-dir", outDir]);
    assert.equal(
      result.status,
      0,
      `expected exit 0\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
    );

    const dePath = join(outDir, "og-default-de.png");
    const enPath = join(outDir, "og-default-en.png");
    assert.ok(existsSync(dePath), "expected og-default-de.png to exist");
    assert.ok(existsSync(enPath), "expected og-default-en.png to exist");

    for (const path of [dePath, enPath]) {
      const header = readPngHeader(path);
      assert.ok(header.magicOk, `bad PNG magic bytes in ${path}`);
      assert.equal(header.width, 1200, `width mismatch in ${path}`);
      assert.equal(header.height, 630, `height mismatch in ${path}`);
    }
  } finally {
    cleanup(outDir);
  }
});

// ---------------------------------------------------------------------------
// 7.2 — --lang de writes only de
// ---------------------------------------------------------------------------

test("7.2 --lang de writes only de", () => {
  const outDir = mkTmpOutDir();
  try {
    const result = runCli(["--out-dir", outDir, "--lang", "de"]);
    assert.equal(
      result.status,
      0,
      `expected exit 0\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
    );

    assert.ok(
      existsSync(join(outDir, "og-default-de.png")),
      "expected og-default-de.png to exist",
    );
    assert.equal(
      existsSync(join(outDir, "og-default-en.png")),
      false,
      "expected og-default-en.png NOT to exist",
    );
  } finally {
    cleanup(outDir);
  }
});

// ---------------------------------------------------------------------------
// 7.3 — --lang en writes only en
// ---------------------------------------------------------------------------

test("7.3 --lang en writes only en", () => {
  const outDir = mkTmpOutDir();
  try {
    const result = runCli(["--out-dir", outDir, "--lang", "en"]);
    assert.equal(
      result.status,
      0,
      `expected exit 0\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
    );

    assert.ok(
      existsSync(join(outDir, "og-default-en.png")),
      "expected og-default-en.png to exist",
    );
    assert.equal(
      existsSync(join(outDir, "og-default-de.png")),
      false,
      "expected og-default-de.png NOT to exist",
    );
  } finally {
    cleanup(outDir);
  }
});

// ---------------------------------------------------------------------------
// 7.4 — invalid --lang exits 1 with helpful message
// ---------------------------------------------------------------------------

test("7.4 invalid --lang exits 1 with helpful message", () => {
  const outDir = mkTmpOutDir();
  try {
    const result = runCli(["--out-dir", outDir, "--lang", "fr"]);
    assert.equal(result.status, 1, `expected exit 1, stdout: ${result.stdout}`);
    assert.match(
      result.stderr,
      /fr/,
      `stderr should mention the bad value "fr": ${result.stderr}`,
    );
    assert.match(
      result.stderr,
      /de, en/,
      `stderr should list accepted locales: ${result.stderr}`,
    );
  } finally {
    cleanup(outDir);
  }
});

// ---------------------------------------------------------------------------
// 7.4b — `--key=value` syntax for known flags exits 1 with usage hint
// ---------------------------------------------------------------------------

test("7.4b --lang=de hints at the supported syntax", () => {
  const result = runCli(["--lang=de"]);
  assert.equal(result.status, 1, `expected exit 1, stdout: ${result.stdout}`);
  assert.match(
    result.stderr,
    /--lang=de/,
    `stderr should echo the bad arg: ${result.stderr}`,
  );
  assert.match(
    result.stderr,
    /--lang <value>/,
    `stderr should suggest the supported syntax: ${result.stderr}`,
  );
});

test("7.4c --frobnicate=x falls through to generic unknown-option (no false hint)", () => {
  const result = runCli(["--frobnicate=x"]);
  assert.equal(result.status, 1, `expected exit 1, stdout: ${result.stdout}`);
  assert.match(
    result.stderr,
    /Unknown option: --frobnicate=x/,
    `stderr should name the unknown option: ${result.stderr}`,
  );
  assert.doesNotMatch(
    result.stderr,
    /--frobnicate <value>/,
    `stderr must NOT advertise an unsupported flag: ${result.stderr}`,
  );
});

// ---------------------------------------------------------------------------
// 7.5 — missing tagline (fixture) exits 1
// ---------------------------------------------------------------------------

test("7.5 missing tagline in fixture exits 1", () => {
  const projectRoot = setupFixtureRoot();
  const outDir = mkTmpOutDir();
  try {
    // Rewrite en.json to drop site.tagline.
    const enPath = join(projectRoot, "src", "i18n", "en.json");
    writeFileSync(
      enPath,
      JSON.stringify({ site: { name: "Fixture EN" } }, null, 2) + "\n",
    );

    const result = runCli(["--project-root", projectRoot, "--out-dir", outDir]);

    assert.equal(result.status, 1, `expected exit 1, stdout: ${result.stdout}`);
    assert.match(
      result.stderr,
      /site\.tagline/,
      `stderr should name "site.tagline": ${result.stderr}`,
    );
    assert.ok(
      result.stderr.includes(enPath),
      `stderr should include the file path "${enPath}": ${result.stderr}`,
    );
  } finally {
    cleanup(projectRoot, outDir);
  }
});

// ---------------------------------------------------------------------------
// 7.6 — missing favicon (fixture) exits 1
// ---------------------------------------------------------------------------

test("7.6 missing favicon in fixture exits 1", () => {
  const projectRoot = setupFixtureRoot();
  const outDir = mkTmpOutDir();
  try {
    const faviconPath = join(projectRoot, "public", "favicon.svg");
    unlinkSync(faviconPath);

    const result = runCli(["--project-root", projectRoot, "--out-dir", outDir]);

    assert.equal(result.status, 1, `expected exit 1, stdout: ${result.stdout}`);
    assert.match(
      result.stderr,
      /public\/favicon\.svg/,
      `stderr should name "public/favicon.svg": ${result.stderr}`,
    );
  } finally {
    cleanup(projectRoot, outDir);
  }
});

// ---------------------------------------------------------------------------
// 7.7 — bad accent color (fixture) succeeds with warning
// ---------------------------------------------------------------------------

test("7.7 bad accent color falls back with [warn] and still writes png", () => {
  const projectRoot = setupFixtureRoot();
  const outDir = mkTmpOutDir();
  try {
    const cssPath = join(projectRoot, "src", "styles", "global.css");
    writeFileSync(cssPath, "@theme {\n  --color-accent: not-a-color;\n}\n");

    const result = runCli([
      "--project-root",
      projectRoot,
      "--out-dir",
      outDir,
      "--lang",
      "de",
    ]);

    assert.equal(
      result.status,
      0,
      `expected exit 0\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
    );
    assert.match(
      result.stderr,
      /\[warn\]/,
      `stderr should contain "[warn]": ${result.stderr}`,
    );
    // Pin the warn content: it must name the actual bad value so a future
    // regression (e.g. swallowing the value or printing a generic message)
    // is caught — not just any [warn] line.
    assert.match(
      result.stderr,
      /not-a-color/,
      `stderr [warn] should name the bad value: ${result.stderr}`,
    );

    const dePath = join(outDir, "og-default-de.png");
    assert.ok(existsSync(dePath), "expected og-default-de.png to exist");
    const header = readPngHeader(dePath);
    assert.ok(header.magicOk, "bad PNG magic bytes");
    assert.equal(header.width, 1200);
    assert.equal(header.height, 630);
  } finally {
    cleanup(projectRoot, outDir);
  }
});
