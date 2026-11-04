---
name: new-post
description: Create a new bilingual blog post with proper frontmatter and both DE/EN files.
---

# Create a New Blog Post

Create a bilingual (DE + EN) blog post with correct frontmatter, real content, and a commit.

## Gather info

Ask these ONE AT A TIME using the AskUserQuestion tool:

1. "What's the blog post about? Give me a title or topic."
2. "What should it say? Notes, bullet points or a rough draft are all fine."
3. "Who's the author?"
4. "Any tags? Pick from: KI/AI, Webentwicklung/Web Development, Design, Business, Tutorial — or add your own."

## Write the post

Write the post in both languages from what the user gave you. Each language should read as if a native speaker wrote it. You can explain general topics, but don't invent facts about the business, customers or numbers. Show the user the draft and adjust it before committing. Never commit placeholder text, because it would go live.

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

<German post body>
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

<English post body>
```

**Only include `heroImage` if the image file exists.** A path to a missing file fails the whole build. Posts work fine without one.

## Hero image

Check if `OPENAI_API_KEY` is set, in `.env` or the environment. If it is, ask:

> "Want me to generate a hero image for this post?"

If yes, run:

```bash
pnpm generate-image "<descriptive prompt for the topic>. Editorial photography style, modern and clean. No text, no logos." -o src/assets/blog/<asset-slug>.png --size 1536x1024
```

If the key is missing, leave `heroImage` out and move on.

## Commit

IMPORTANT: Never commit a single-locale entry. Both DE and EN files must exist before committing.

Stage both files (and the image if generated), then commit:

```bash
git add src/content/blog/de/<de-slug>.md src/content/blog/en/<en-slug>.md src/assets/blog/<asset-slug>.png  # image only if generated
git commit -m "feat: add blog post — <translationKey>"
```

In a cloud session, also push: `git push -u origin HEAD`.

Tell the user the post is saved in both languages. In a local session, start `pnpm dev` yourself and give them the link. In a cloud session, tell them it appears on the preview link once the pull request is open, or on the site once it's merged.
