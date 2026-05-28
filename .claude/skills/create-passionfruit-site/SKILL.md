---
name: create-passionfruit-site
description: Use when the user wants to START a new passionfruit website from scratch — typical phrasings are "create a new passionfruit site", "start a new site from the passionfruit template", "bootstrap a passionfruit project", or invoking `/create-passionfruit-site`. Clones the template into a new directory, initializes git, installs dependencies, and hands off to `/onboard`. Do NOT use when the user is already working inside an existing passionfruit site (they want `/onboard` directly).
---

# Bootstrap a new passionfruit site

This skill turns a Claude Code session with no project into a personalized passionfruit website. It's the entry point for users who installed the plugin from the marketplace and want to start fresh.

## When to trigger

- User explicitly runs `/create-passionfruit-site`
- User says "create a new passionfruit site", "I want to build a website with passionfruit", "bootstrap a passionfruit project"
- The cwd is **not** already a passionfruit repo (no `.claude-plugin/plugin.json` with `"name": "passionfruit"`)

If the cwd already contains a passionfruit repo, stop and tell the user:

> "You're already inside a passionfruit site. Run `/onboard` to personalize it."

## Step 1: Prerequisites

Run silently:

```bash
node --version    # must be >= 24
pnpm --version    # must exist
git --version     # must exist
gh --version      # optional, enables direct GitHub repo creation
```

If Node < 24 or missing: instruct the user to install Node 24+ (`brew install node` / nodejs.org) and come back.
If pnpm missing: `npm install -g pnpm` or `corepack enable && corepack prepare pnpm@latest --activate`.
If git missing: `xcode-select --install` (Mac) / nodejs.org / `apt install git`.

Don't announce success — only speak up if something needs the user's action.

## Step 2: Gather info

Ask these ONE AT A TIME using AskUserQuestion:

1. **"What should the new site be called?"** — used as the directory name and (if applicable) GitHub repo name. Validate: kebab-case, ASCII letters/digits/dashes, no spaces, doesn't already exist in cwd.
2. **"Where should the site live?"** — three options:
   - `GitHub (public)` — needs `gh` authenticated
   - `GitHub (private)` — needs `gh` authenticated
   - `Local only` — clones from GitHub, strips remote, re-inits git

If the user picks a GitHub option but `gh auth status` fails, fall back to Local only and tell the user they can `gh repo create` and push later.

## Step 3: Scaffold

### GitHub path (option A or B)

```bash
gh repo create <name> --template passion4it-gmbh/passionfruit --<public|private> --clone
cd <name>
```

`gh repo create … --template` creates a fresh repo from the template (no template's git history) and clones it locally.

### Local-only path (option C)

```bash
git clone --depth 1 https://github.com/passion4it-gmbh/passionfruit.git <name>
cd <name>
rm -rf .git
git init -b main
```

Don't make the first commit yet — `pnpm install` is about to modify the lockfile resolution cache, and `/onboard` will strip framework metadata before the first user-facing commit.

## Step 4: Install dependencies

```bash
pnpm install
```

Watch for failures:

- If `prepare` fails because lefthook can't install hooks: this is the worktree quirk. Run `./node_modules/.bin/lefthook install --force` once and continue.
- If pnpm complains about Node version: re-check Step 1 prerequisites.

## Step 5: Hand off

Tell the user:

> "Your passionfruit site is scaffolded at `<name>/`. Two next steps:
>
> 1. **`/onboard`** — personalize the template (company name, languages, colors, pages).
> 2. **`/brand`** — replace placeholder favicon and social sharing image.
>
> When you're ready to ship: **`/deploy`** sets up free Cloudflare Pages hosting."

If the user picked a GitHub path, also mention:

> "Your repo is live at `https://github.com/<user>/<name>`."

Then **stop**. Don't auto-run `/onboard` — let the user invoke it when they're ready. The bootstrap skill's job is done.

## Failure modes

| Symptom                                | Cause                            | Fix                                                                         |
| -------------------------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| `gh repo create` says "not found"      | User not authenticated with `gh` | `gh auth login` then retry, or pick Local-only                              |
| `git clone` fails with auth prompt     | Public repo over HTTPS, no token | Should never happen for the public template; check network                  |
| `pnpm install` fails on `prepare`      | lefthook + non-default hooksPath | `./node_modules/.bin/lefthook install --force`; then `pnpm install` again   |
| Directory `<name>` already exists      | Name collision                   | Ask user for a different name, or to remove the existing directory          |
| Node version too old                   | `node --version` < 24            | Stop and instruct user to upgrade Node                                      |
