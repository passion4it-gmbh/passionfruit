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
