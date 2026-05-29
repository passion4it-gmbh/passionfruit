# Component sidecar documentation

**Date:** 2026-05-28
**Status:** Approved, awaiting implementation plan

## Problem

`src/components/CLAUDE.md` is a single 268-line file documenting every component. It is loaded into Claude's context whenever any work happens inside `src/components/`. As the component set grows, the file grows; reading it to look up one component costs tokens proportional to all components.

Beyond token cost, the monolithic file rots: component changes don't co-locate with doc changes, deletions leave stale entries, and downstream users' Claude sessions (composing pages from this template) need precise per-component prop/usage info that is hard to surface from a long unstructured document.

## Goals

1. Token efficiency — Claude reads only the docs for the components it touches.
2. Co-location and reduced rot — docs live next to the component they describe.
3. Better composition support for downstream Claude sessions building new pages.
4. Cleaner mental model — one doc file per component, deletable as a unit.

## Non-goals

- Documenting Astro layouts (`src/layouts/`) or routed pages (`src/pages/`).
- Automatic prop-table extraction from `Props` interfaces. Manual maintenance for now.
- Runtime / MCP-server delivery of component docs. Static markdown only.
- Replacing `STYLE_GUIDE.md`. Style rules stay there; sidecars cover component-specific usage.

## Scope

Sidecars are created for:

- Every `.astro` file directly under `src/components/`.
- Every `.astro` file under `src/components/pages/` (page templates downstream Claude clones).

Both groups follow the same sidecar template; page sidecars are tagged `page` in frontmatter and their Example section describes "what this page composes" rather than a self-invocation.

## Architecture overview

Three artifacts:

1. **Per-component sidecar files** (`<Component>.md` next to `<Component>.astro`) — strictly templated.
2. **A shrunken `src/components/CLAUDE.md`** — a small hand-maintained header (shared conventions, pointer to style guide) plus an auto-generated catalog block.
3. **A prebuild check script** (`scripts/check-component-docs.mjs`) — validates coverage and schema, regenerates the catalog.

Together: Claude reading anything in `src/components/` gets the 30-40 line conventions + catalog menu for free, and drills into individual sidecars only as needed.

## Sidecar contract

### File location

Each `.astro` component has a sibling `.md` file with the identical basename, in the same directory.

### Frontmatter (YAML)

Required keys:

- `component` — PascalCase name; MUST match the `.astro` filename.
- `oneLiner` — string, MUST be ≤80 characters, used as the catalog row.
- `status` — one of `stable`, `beta`, `deprecated`.
- `tags` — array of free-form strings; used to group rows in the catalog. Page sidecars include `page`.

### Body

H2 sections, in this exact order, all present (empty allowed — write `None` if there is nothing to say):

1. `## Purpose` — 1–3 sentences. What problem the component solves.
2. `## When to use` — bulleted positive triggers, concrete scenarios.
3. `## When NOT to use` — bulleted anti-triggers; points at the right alternative when known.
4. `## Props` — a markdown table with columns `Prop | Type | Required | Default | Notes`. Use `None` for component-less props.
5. `## Example` — minimal copy-paste-ready Astro snippet with imports. For page sidecars, lists composed components instead.
6. `## i18n keys` — table of every `t('…')` call this component makes, or `None`.
7. `## Gotchas` — bulleted; constraints that bite (required images, build-time-only behavior, locale assumptions). Or `None`.

No other H2 sections allowed. Subsections via H3 are fine inside any of the seven.

## `components/CLAUDE.md` after migration

Two regions:

**Top, hand-maintained** — shared conventions (Astro over React; no hex; lucide icons; i18n via `useTranslations`; image rules; STYLE_GUIDE pointer). Approximately 30-40 lines.

**Bottom, auto-generated catalog** — enclosed between literal HTML comments `<!-- CATALOG:START -->` and `<!-- CATALOG:END -->`. Inside: H3 subsection per unique `tags` value, each containing a table of `Component | Status | One-liner | Docs-link`. Components with multiple tags appear under their first tag only (sort by frontmatter order). The check script rewrites this block deterministically.

Maintainers never edit the catalog block. Editing the hand-maintained top region does not require the script to run.

## Check script behavior

`scripts/check-component-docs.mjs`, wired into `package.json`'s `prebuild` alongside `check-bilingual`. Also exposed standalone as `pnpm sync:component-catalog`.

Three responsibilities, in order:

1. **Coverage check.** For every `.astro` under `src/components/` (recursive), require a sibling `.md`. Missing sidecar → exit 1 with the missing path printed.
2. **Schema check.** Parse each sidecar's frontmatter and body. Validate required frontmatter keys, `oneLiner` length ≤80, `status` enum, presence and ordering of the seven required H2 sections. Any violation → exit 1 with the file path and the specific failure.
3. **Catalog sync.** Regenerate the `CATALOG:START`/`CATALOG:END` block from all valid sidecars.
   - **Local dev behavior:** if regenerated block differs from disk, write it in place and continue (exit 0). Acts like a formatter.
   - **CI behavior:** if regenerated block differs from disk, exit 1 with a diff and the message `Run pnpm sync:component-catalog locally and commit.` CI detection via the `CI` environment variable.

The script never edits sidecar files — only `components/CLAUDE.md`'s catalog block.

## Skill integration

The existing `.claude/skills/passionfruit-content` skill is extended (no new skill created):

- Trigger broadened to also fire on `src/components/**` edits.
- A rule is added: when reading, editing, or composing with a component, read its sibling `.md` first. When creating a new component, the sidecar must be created in the same change.

The skill does not duplicate the sidecar template — it points at this spec and the live examples.

## Maintenance choreography

- **New component** — author creates `Foo.astro` and `Foo.md` together. Build fails until the sidecar exists with valid schema. Any scaffolding skill (e.g. future `/new-component`) emits both.
- **Renamed component** — both files renamed. Coverage check catches mismatches.
- **Deleted component** — both files deleted. Catalog regenerates without the row.
- **Changed props** — maintainer updates the Props table. No automated check that the table matches the actual `Props` interface; this is accepted manual upkeep.

## Migration

One pull request converts the current monolithic `components/CLAUDE.md` into the new shape:

- Existing component sections in `CLAUDE.md` are mechanically split into per-component sidecars, keeping their content and adding any missing required sections (`When NOT to use`, `Gotchas`).
- Components currently absent from `CLAUDE.md` get newly-authored sidecars.
- Page templates under `src/components/pages/` get newly-authored sidecars.
- `components/CLAUDE.md` is rewritten to the new shrunken form with the auto-generated catalog block populated by the script.
- `scripts/check-component-docs.mjs` is added and wired into `prebuild`.
- The `passionfruit-content` skill is updated.

All in a single PR so the build is never half-converted. CONTRIBUTING.md and the top-level CLAUDE.md "Self-improvement rule" / "Component conventions" sections are updated to reference the new shape and check.

## Open questions / future work

- A future enhancement could parse Astro `Props` interfaces to validate the Props table; out of scope here.
- A future `/new-component` slash command would benefit from emitting the sidecar template skeleton; not part of this spec.
- If catalog grouping by single first-tag turns out to scatter related components confusingly, switch to per-component primary-tag annotation; deferred until first pain.
