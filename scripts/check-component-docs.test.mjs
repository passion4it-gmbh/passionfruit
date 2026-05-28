#!/usr/bin/env node
/**
 * TDD tests for scripts/check-component-docs.mjs
 * Runner: pnpm exec node --test scripts/check-component-docs.test.mjs
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
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
      `---\ncomponent: ${base}\noneLiner: "A concise description of the ${base} component."\nstatus: stable\ntags:\n  - ui\n---\n`;
    const body =
      options.body ??
      `## Purpose\nSolves the problem.\n\n## When to use\n- Use it here.\n\n## When NOT to use\n- Not here.\n\n## Props\nNone.\n\n## Example\n\`\`\`astro\n<${base} />\n\`\`\`\n\n## i18n keys\nNone.\n\n## Gotchas\nNone.\n`;
    writeFileSync(join(dir, `${base}.md`), frontmatter + body);
  }
}

/**
 * Runs the check-component-docs script against the given rootDir.
 * @param {string} rootDir
 * @param {string[]} extraArgs
 * @param {{ env?: NodeJS.ProcessEnv }} [options]
 * @returns {{ status: number, stdout: string, stderr: string }}
 */
function runScript(rootDir, extraArgs = [], options = {}) {
  const result = spawnSync(
    "node",
    [SCRIPT, `--root=${rootDir}`, ...extraArgs],
    {
      encoding: "utf8",
      env: options.env ?? { ...process.env, CI: undefined },
    },
  );
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

/**
 * Writes a CLAUDE.md file in the root dir (simulates the project-level file).
 * @param {string} rootDir
 * @param {string} content
 */
function writeIndex(rootDir, content) {
  writeFileSync(join(rootDir, "CLAUDE.md"), content, "utf8");
}

/**
 * Reads the CLAUDE.md file from the root dir.
 * @param {string} rootDir
 * @returns {string}
 */
function readIndex(rootDir) {
  return readFileSync(join(rootDir, "CLAUDE.md"), "utf8");
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
// 4. Three missing sidecars list all three in stderr
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

// ---------------------------------------------------------------------------
// Schema validation helpers
// ---------------------------------------------------------------------------

/** Builds a valid sidecar frontmatter string. */
function validFrontmatter(name) {
  return `---\ncomponent: ${name}\noneLiner: "A concise description of the ${name} component."\nstatus: stable\ntags:\n  - ui\n---\n`;
}

/** Builds a valid sidecar body with all seven H2 sections in order. */
const VALID_BODY = `## Purpose
Solves the problem.

## When to use
- Use it here.

## When NOT to use
- Not here.

## Props
None.

## Example
\`\`\`astro
<Foo />
\`\`\`

## i18n keys
None.

## Gotchas
None.
`;

// ---------------------------------------------------------------------------
// 8. Schema: valid sidecar passes
// ---------------------------------------------------------------------------
describe("schema: valid sidecar passes", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter: validFrontmatter("Badge"),
      body: VALID_BODY,
    });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 0", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });
});

// ---------------------------------------------------------------------------
// 9. Schema: missing frontmatter exits 1
// ---------------------------------------------------------------------------
describe("schema: missing frontmatter exits 1", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter: "",
      body: VALID_BODY,
    });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr mentions file path and missing component key", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Badge\.md/);
    assert.match(result.stderr, /component/);
  });
});

// ---------------------------------------------------------------------------
// 9b. Schema: malformed YAML frontmatter exits 1
// ---------------------------------------------------------------------------
describe("schema: malformed YAML frontmatter exits 1", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    // Seed a matching .astro so coverage passes, then write a sidecar with
    // syntactically invalid YAML (unclosed double-quote).
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(join(tmpDir, "Badge.astro"), "---\n---\n<div />");
    writeFileSync(
      join(tmpDir, "Badge.md"),
      '---\ncomponent: "unclosed\n---\nbody',
    );
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr contains 'could not parse' and the file basename", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /could not parse/i);
    assert.match(result.stderr, /Badge\.md/);
  });
});

// ---------------------------------------------------------------------------
// 10. Schema: missing `component` key exits 1
// ---------------------------------------------------------------------------
describe("schema: missing component key exits 1", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter:
        '---\noneLiner: "A description."\nstatus: stable\ntags:\n  - ui\n---\n',
      body: VALID_BODY,
    });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr mentions file path and component key", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Badge\.md/);
    assert.match(result.stderr, /component/);
  });
});

// ---------------------------------------------------------------------------
// 11. Schema: component mismatched with filename exits 1
// ---------------------------------------------------------------------------
describe("schema: component mismatch exits 1", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    // File is Badge.md but frontmatter says component: Foo
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter:
        '---\ncomponent: Foo\noneLiner: "A description."\nstatus: stable\ntags:\n  - ui\n---\n',
      body: VALID_BODY,
    });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr mentions file path and mismatch reason", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Badge\.md/);
    assert.match(result.stderr, /mismatch/i);
  });
});

// ---------------------------------------------------------------------------
// 12. Schema: missing `oneLiner` exits 1
// ---------------------------------------------------------------------------
describe("schema: missing oneLiner exits 1", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter:
        "---\ncomponent: Badge\nstatus: stable\ntags:\n  - ui\n---\n",
      body: VALID_BODY,
    });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr mentions file path and oneLiner", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Badge\.md/);
    assert.match(result.stderr, /oneLiner/);
  });
});

// ---------------------------------------------------------------------------
// 13. Schema: oneLiner over 80 chars exits 1
// ---------------------------------------------------------------------------
describe("schema: oneLiner over 80 chars exits 1", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    const longLine = "x".repeat(81);
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter: `---\ncomponent: Badge\noneLiner: "${longLine}"\nstatus: stable\ntags:\n  - ui\n---\n`,
      body: VALID_BODY,
    });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr mentions file path and oneLiner length", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Badge\.md/);
    assert.match(result.stderr, /oneLiner/);
    assert.match(result.stderr, /80/);
  });
});

// ---------------------------------------------------------------------------
// 14. Schema: invalid status value exits 1
// ---------------------------------------------------------------------------
describe("schema: invalid status value exits 1", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter:
        '---\ncomponent: Badge\noneLiner: "A description."\nstatus: experimental\ntags:\n  - ui\n---\n',
      body: VALID_BODY,
    });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr mentions file path and status", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Badge\.md/);
    assert.match(result.stderr, /status/);
  });
});

// ---------------------------------------------------------------------------
// 15. Schema: missing tags exits 1
// ---------------------------------------------------------------------------
describe("schema: missing tags exits 1", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter:
        '---\ncomponent: Badge\noneLiner: "A description."\nstatus: stable\n---\n',
      body: VALID_BODY,
    });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr mentions file path and tags", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Badge\.md/);
    assert.match(result.stderr, /tags/);
  });
});

// ---------------------------------------------------------------------------
// 16. Schema: empty tags array exits 1
// ---------------------------------------------------------------------------
describe("schema: empty tags array exits 1", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter:
        '---\ncomponent: Badge\noneLiner: "A description."\nstatus: stable\ntags: []\n---\n',
      body: VALID_BODY,
    });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr mentions file path and tags", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Badge\.md/);
    assert.match(result.stderr, /tags/);
  });
});

// ---------------------------------------------------------------------------
// 17. Schema: missing H2 section exits 1
// ---------------------------------------------------------------------------
describe("schema: missing H2 section exits 1", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    // Body has only six of seven required H2s (Gotchas is missing)
    const incompleteBody = `## Purpose
Solves the problem.

## When to use
- Use it here.

## When NOT to use
- Not here.

## Props
None.

## Example
\`\`\`astro
<Badge />
\`\`\`

## i18n keys
None.
`;
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter: validFrontmatter("Badge"),
      body: incompleteBody,
    });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr mentions file path and the missing section", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Badge\.md/);
    assert.match(result.stderr, /Gotchas/);
  });
});

// ---------------------------------------------------------------------------
// 18. Schema: H2 sections out of order exits 1
// ---------------------------------------------------------------------------
describe("schema: H2 sections out of order exits 1", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    // Gotchas appears before i18n keys
    const outOfOrderBody = `## Purpose
Solves the problem.

## When to use
- Use it here.

## When NOT to use
- Not here.

## Props
None.

## Example
\`\`\`astro
<Badge />
\`\`\`

## Gotchas
None.

## i18n keys
None.
`;
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter: validFrontmatter("Badge"),
      body: outOfOrderBody,
    });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr mentions file path and order", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Badge\.md/);
    assert.match(result.stderr, /out of order/i);
  });
});

// ---------------------------------------------------------------------------
// 19. Schema: disallowed extra H2 exits 1
// ---------------------------------------------------------------------------
describe("schema: disallowed extra H2 exits 1", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    const extraH2Body = VALID_BODY + "\n## Notes\nExtra section.\n";
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter: validFrontmatter("Badge"),
      body: extraH2Body,
    });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr mentions file path and disallowed section", () => {
    const result = runScript(tmpDir);
    assert.match(result.stderr, /Badge\.md/);
    assert.match(result.stderr, /Notes/);
  });
});

// ---------------------------------------------------------------------------
// 20. Schema: H3 subsections inside the seven H2s are allowed
// ---------------------------------------------------------------------------
describe("schema: H3 subsections inside H2s are allowed", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-schema-"));
    const bodyWithH3 = `## Purpose
Solves the problem.

### Sub-purpose
More detail.

## When to use
- Use it here.

## When NOT to use
- Not here.

## Props
None.

## Example
\`\`\`astro
<Badge />
\`\`\`

## i18n keys
None.

## Gotchas
### Watch out
None.
`;
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter: validFrontmatter("Badge"),
      body: bodyWithH3,
    });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 0", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });
});

// ---------------------------------------------------------------------------
// Catalog helpers
// ---------------------------------------------------------------------------

/**
 * Builds valid frontmatter for a component with custom tags and status.
 * @param {string} name
 * @param {string[]} tags
 * @param {{ status?: string, oneLiner?: string }} [opts]
 */
function catalogFrontmatter(name, tags, opts = {}) {
  const status = opts.status ?? "stable";
  const oneLiner =
    opts.oneLiner ?? `A concise description of the ${name} component.`;
  const tagLines = tags.map((t) => `  - ${t}`).join("\n");
  return `---\ncomponent: ${name}\noneLiner: "${oneLiner}"\nstatus: ${status}\ntags:\n${tagLines}\n---\n`;
}

// ---------------------------------------------------------------------------
// 21. Catalog: fresh CLAUDE.md gets catalog block appended
// ---------------------------------------------------------------------------
describe("catalog: fresh CLAUDE.md gets catalog block appended", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-catalog-"));
    seedComponent(tmpDir, "Alpha", {
      withDoc: true,
      frontmatter: catalogFrontmatter("Alpha", ["card"]),
      body: VALID_BODY,
    });
    seedComponent(tmpDir, "Beta", {
      withDoc: true,
      frontmatter: catalogFrontmatter("Beta", ["layout"]),
      body: VALID_BODY,
    });
    seedComponent(tmpDir, "Gamma", {
      withDoc: true,
      frontmatter: catalogFrontmatter("Gamma", ["card"]),
      body: VALID_BODY,
    });
    writeIndex(
      tmpDir,
      "# Conventions\n\nShared component conventions go here.\n",
    );
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 0", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });

  it("CLAUDE.md contains CATALOG:START marker", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    assert.ok(
      content.includes("<!-- CATALOG:START -->"),
      "missing CATALOG:START",
    );
  });

  it("CLAUDE.md contains CATALOG:END marker", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    assert.ok(content.includes("<!-- CATALOG:END -->"), "missing CATALOG:END");
  });

  it("original top region is preserved unchanged", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    assert.ok(content.startsWith("# Conventions\n"), "top region was modified");
  });

  it("catalog lists all three components", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    assert.ok(content.includes("Alpha"), "Alpha missing from catalog");
    assert.ok(content.includes("Beta"), "Beta missing from catalog");
    assert.ok(content.includes("Gamma"), "Gamma missing from catalog");
  });
});

// ---------------------------------------------------------------------------
// 22. Catalog: existing catalog block is replaced, not appended
// ---------------------------------------------------------------------------
describe("catalog: existing block is replaced, not appended", () => {
  let tmpDir;
  const STALE = "<!-- CATALOG:START -->\nSTALE CONTENT\n<!-- CATALOG:END -->";

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-catalog-"));
    seedComponent(tmpDir, "Widget", {
      withDoc: true,
      frontmatter: catalogFrontmatter("Widget", ["ui"]),
      body: VALID_BODY,
    });
    writeIndex(tmpDir, `# Header\n\n${STALE}\n`);
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 0", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });

  it("stale content is replaced", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    assert.ok(
      !content.includes("STALE CONTENT"),
      "stale content still present",
    );
  });

  it("prefix before CATALOG:START is unchanged (byte-compare)", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    const startIdx = content.indexOf("<!-- CATALOG:START -->");
    const prefix = content.slice(0, startIdx);
    assert.equal(prefix, "# Header\n\n");
  });
});

// ---------------------------------------------------------------------------
// 23. Catalog: row format contains component name, status, oneLiner, link
// ---------------------------------------------------------------------------
describe("catalog: row format contains required fields", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-catalog-"));
    seedComponent(tmpDir, "Badge", {
      withDoc: true,
      frontmatter: catalogFrontmatter("Badge", ["ui"], {
        oneLiner: "Small label to annotate content.",
      }),
      body: VALID_BODY,
    });
    seedComponent(tmpDir, "pages/about", {
      withDoc: true,
      frontmatter: catalogFrontmatter("about", ["page"], {
        oneLiner: "About page template.",
      }),
      body: VALID_BODY,
    });
    writeIndex(tmpDir, "# Components\n");
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("row contains component name", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    assert.ok(content.includes("Badge"), "component name missing");
  });

  it("row contains status", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    assert.ok(content.includes("stable"), "status missing");
  });

  it("row contains oneLiner", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    assert.ok(
      content.includes("Small label to annotate content."),
      "oneLiner missing",
    );
  });

  it("top-level sidecar link uses ./Badge.md format", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    assert.ok(
      content.includes("[Badge.md](./Badge.md)"),
      "top-level link format wrong",
    );
  });

  it("nested sidecar link uses ./pages/about.md format", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    assert.ok(
      content.includes("[about.md](./pages/about.md)"),
      "nested link format wrong",
    );
  });
});

// ---------------------------------------------------------------------------
// 24. Catalog: grouping by first tag, alphabetical sort
// ---------------------------------------------------------------------------
describe("catalog: grouping by first tag, alphabetical sort within group", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-catalog-"));
    // card group: two components, alphabetical order should be Apple < Zebra
    seedComponent(tmpDir, "Zebra", {
      withDoc: true,
      frontmatter: catalogFrontmatter("Zebra", ["card"]),
      body: VALID_BODY,
    });
    seedComponent(tmpDir, "Apple", {
      withDoc: true,
      frontmatter: catalogFrontmatter("Apple", ["card"]),
      body: VALID_BODY,
    });
    // layout group: multi-tag (layout, primitive) — grouped under first tag "layout"
    seedComponent(tmpDir, "Row", {
      withDoc: true,
      frontmatter: catalogFrontmatter("Row", ["layout", "primitive"]),
      body: VALID_BODY,
    });
    writeIndex(tmpDir, "# Components\n");
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 0", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });

  it("card group appears before layout group (alphabetical tag order)", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    const cardIdx = content.indexOf("### card");
    const layoutIdx = content.indexOf("### layout");
    assert.ok(cardIdx !== -1, "card group missing");
    assert.ok(layoutIdx !== -1, "layout group missing");
    assert.ok(
      cardIdx < layoutIdx,
      "card group should come before layout group",
    );
  });

  it("within card group, Apple appears before Zebra (alphabetical component order)", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    const appleIdx = content.indexOf("Apple");
    const zebraIdx = content.indexOf("Zebra");
    assert.ok(appleIdx < zebraIdx, "Apple should come before Zebra");
  });

  it("Row appears only in layout group (first tag), no primitive group", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    assert.ok(content.includes("### layout"), "layout group missing");
    assert.ok(
      !content.includes("### primitive"),
      "primitive group should not exist",
    );
    const layoutSection = content.slice(content.indexOf("### layout"));
    assert.ok(layoutSection.includes("Row"), "Row missing from layout group");
  });
});

// ---------------------------------------------------------------------------
// 25. Catalog: local mode rewrites file and exits 0
// ---------------------------------------------------------------------------
describe("catalog: local mode rewrites file and exits 0", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-catalog-"));
    seedComponent(tmpDir, "Card", {
      withDoc: true,
      frontmatter: catalogFrontmatter("Card", ["ui"]),
      body: VALID_BODY,
    });
    writeIndex(tmpDir, "# Components\n\nNo catalog yet.\n");
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 0 in local mode", () => {
    const result = runScript(tmpDir, [], {
      env: { ...process.env, CI: undefined },
    });
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });

  it("stdout includes catalog updated notice", () => {
    writeIndex(tmpDir, "# Components\n\nNo catalog yet.\n");
    const result = runScript(tmpDir, [], {
      env: { ...process.env, CI: undefined },
    });
    assert.match(result.stdout, /catalog updated/i);
  });

  it("CLAUDE.md is written with catalog block", () => {
    writeIndex(tmpDir, "# Components\n\nNo catalog yet.\n");
    runScript(tmpDir, [], { env: { ...process.env, CI: undefined } });
    const content = readIndex(tmpDir);
    assert.ok(
      content.includes("<!-- CATALOG:START -->"),
      "catalog block missing after local run",
    );
  });
});

// ---------------------------------------------------------------------------
// 26. Catalog: CI mode fails when catalog out of date
// ---------------------------------------------------------------------------
describe("catalog: CI mode fails when catalog out of date", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-catalog-"));
    seedComponent(tmpDir, "Card", {
      withDoc: true,
      frontmatter: catalogFrontmatter("Card", ["ui"]),
      body: VALID_BODY,
    });
    writeIndex(tmpDir, "# Components\n\nNo catalog here.\n");
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 1 when catalog out of date in CI", () => {
    const result = runScript(tmpDir, [], {
      env: { ...process.env, CI: "true" },
    });
    assert.equal(result.status, 1, `stdout: ${result.stdout}`);
  });

  it("stderr includes the fix command", () => {
    const result = runScript(tmpDir, [], {
      env: { ...process.env, CI: "true" },
    });
    assert.match(
      result.stderr,
      /Run pnpm sync:component-catalog locally and commit\./,
    );
  });

  it("file on disk is unchanged after CI run", () => {
    const before = readIndex(tmpDir);
    runScript(tmpDir, [], { env: { ...process.env, CI: "true" } });
    const after = readIndex(tmpDir);
    assert.equal(after, before, "CI mode must not write to disk");
  });
});

// ---------------------------------------------------------------------------
// 27. Catalog: CI mode exits 0 when catalog is in sync
// ---------------------------------------------------------------------------
describe("catalog: CI mode exits 0 when catalog in sync", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-catalog-"));
    seedComponent(tmpDir, "Card", {
      withDoc: true,
      frontmatter: catalogFrontmatter("Card", ["ui"]),
      body: VALID_BODY,
    });
    // Run in local mode first to write the correct catalog
    writeIndex(tmpDir, "# Components\n");
    runScript(tmpDir, [], { env: { ...process.env, CI: undefined } });
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 0 when catalog is already in sync", () => {
    const result = runScript(tmpDir, [], {
      env: { ...process.env, CI: "true" },
    });
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });

  it("stdout includes catalog in sync", () => {
    const result = runScript(tmpDir, [], {
      env: { ...process.env, CI: "true" },
    });
    assert.match(result.stdout, /catalog in sync/i);
  });
});

// ---------------------------------------------------------------------------
// 28. Catalog: deprecated status renders distinguishably
// ---------------------------------------------------------------------------
describe("catalog: deprecated status renders distinguishably", () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "comp-docs-catalog-"));
    seedComponent(tmpDir, "OldCard", {
      withDoc: true,
      frontmatter: catalogFrontmatter("OldCard", ["ui"], {
        status: "deprecated",
      }),
      body: VALID_BODY,
    });
    writeIndex(tmpDir, "# Components\n");
  });

  after(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("exits 0", () => {
    const result = runScript(tmpDir);
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  });

  it("catalog row contains deprecated literally", () => {
    runScript(tmpDir);
    const content = readIndex(tmpDir);
    assert.ok(
      content.includes("deprecated"),
      "deprecated status not in catalog row",
    );
  });
});
