---
name: new-post
description: Create a new bilingual blog post with proper frontmatter and both DE/EN files.
---

# Create a New Blog Post

Create a bilingual (DE + EN) blog post with correct frontmatter, placeholder content, and a commit.

## Gather info

Ask these ONE AT A TIME using the AskUserQuestion tool:

1. "What's the blog post about? Give me a title or topic."
2. "Who's the author?"
3. "Any tags? Pick from: KI/AI, Webentwicklung/Web Development, Design, Business, Tutorial — or add your own."

## Generate identifiers

- `translationKey`: derive from the English version of the title, kebab-case, ASCII-only (e.g., "websites-with-ai"). This is shared across both locale files.
- DE slug: German-friendly kebab-case filename (e.g., `webseiten-mit-ki.md`)
- EN slug: English-friendly kebab-case filename (e.g., `websites-with-ai.md`)
- Asset slug: short kebab-case name for the hero image (e.g., `ai-websites`)

If the user gave a German title, translate it for the EN version (and vice versa). Both titles should feel natural in their language.

## Localize tags

Tags must match the locale. Use these pairs:

| DE tag         | EN tag          |
| -------------- | --------------- |
| KI             | AI              |
| Webentwicklung | Web Development |
| Design         | Design          |
| Business       | Business        |
| Tutorial       | Tutorial        |
| Unternehmen    | Company         |

For custom tags, translate them appropriately.

## Create the files

### `src/content/blog/de/<de-slug>.md`

```markdown
---
translationKey: "<translationKey>"
title: "<German title>"
description: "<German description — one sentence summarizing the post>"
publishedAt: <today's date as YYYY-MM-DD, no quotes>
author: "<author>"
tags: ["<DE tags>"]
heroImage: "../../../assets/blog/<asset-slug>.png"
featured: false
---

## <German heading>

Dieser Beitrag ist noch in Arbeit. Ersetzen Sie diesen Text durch Ihren Inhalt.
```

### `src/content/blog/en/<en-slug>.md`

```markdown
---
translationKey: "<translationKey>"
title: "<English title>"
description: "<English description — one sentence summarizing the post>"
publishedAt: <today's date as YYYY-MM-DD, no quotes>
author: "<author>"
tags: ["<EN tags>"]
heroImage: "../../../assets/blog/<asset-slug>.png"
featured: false
---

## <English heading>

This post is still a work in progress. Replace this text with your content.
```

## Hero image

Check if `OPENAI_API_KEY` exists in `.env`. If it does, ask:

> "Want me to generate a hero image for this post?"

If yes, run:

```bash
pnpm generate-image "<descriptive prompt for the topic>. Editorial photography style, modern and clean. No text, no logos." -o src/assets/blog/<asset-slug>.png --size 1536x1024
```

If the key is missing, tell the user:

> "To generate a hero image later, add an OPENAI_API_KEY to .env and run:
> `pnpm generate-image \"<prompt>\" -o src/assets/blog/<asset-slug>.png --size 1536x1024`"

## Commit

IMPORTANT: Never commit a single-locale entry. Both DE and EN files must exist before committing.

Stage both files (and the image if generated), then commit:

```bash
git add src/content/blog/de/<de-slug>.md src/content/blog/en/<en-slug>.md
git commit -m "feat: add blog post — <translationKey>"
```

Tell the user:

> "Blog post created! Edit the placeholder content in:
>
> - `src/content/blog/de/<de-slug>.md`
> - `src/content/blog/en/<en-slug>.md`
>
> Run `pnpm dev` to preview it."
