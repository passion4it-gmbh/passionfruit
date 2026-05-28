---
name: brand
description: Replace placeholder favicon and OG image with your brand assets. Supports uploading existing logos or generating new ones.
---

# Brand Assets

This skill helps users replace the template's placeholder favicon and OG image with their own brand assets.

## When to trigger

- User explicitly runs `/brand`
- Suggested after `/onboard` completes

## Step 1: Logo / Favicon

Ask using AskUserQuestion with these options:

> "Let's set up your brand assets. Do you have a logo?"

Options:

- "Yes, I have a logo file"
- "No, generate one for me"
- "Skip for now"

### Option A: User has a logo file

Ask for the file path. Then:

1. **If SVG:** Copy it to `public/favicon.svg`. This is the preferred format — crisp at all sizes.
2. **If PNG/JPG:** Create an SVG wrapper that embeds the raster image:
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" width="32" height="32">
     <image href="data:image/png;base64,..." width="32" height="32"/>
   </svg>
   ```
   Base64-encode the image and embed it. Also suggest generating an SVG-native version using `pnpm generate-image` for better scaling.
3. **Generate `public/favicon.ico`** for legacy browsers: use sharp to convert the source to a 32x32 ICO, or inform the user they can use an online converter (realfavicongenerator.net). The SVG favicon covers all modern browsers.

### Option B: Generate a logo

Ask: "Describe your brand briefly — what does your company do, and what style do you prefer? (minimal, bold, playful, corporate, etc.)"

Then generate:

```bash
pnpm generate-image "<prompt for a minimal icon suitable as a favicon, simple shapes, single subject, no text>" -o public/favicon-source.png --size 1024x1024
```

**Remind the user:** This requires `OPENAI_API_KEY` in `.env`. If missing, prompt them to add it.

After generation, create `public/favicon.svg` from the result (either use the PNG as a base64-embedded SVG, or ask the user to trace/simplify it for a proper SVG).

### Option C: Skip

Move on. The template ships with a default passionfruit-themed favicon.

## Step 2: OG Image (Social Sharing Preview)

This is the image that appears when someone shares a link to the site on LinkedIn, Twitter/X, Slack, etc. There are two ways to make one — ask the user via AskUserQuestion:

> "How should we create your social sharing image?"

Options:

- "Branded template (recommended)" — composes `site.name` + `site.tagline` + accent color + favicon into a clean 1200×630 PNG. Runs in under a second, no API key needed, produces one image per locale.
- "AI generated" — describe an image and OpenAI's GPT Image model creates it. Slower, costs money, requires `OPENAI_API_KEY`.
- "Skip" — keep whatever's already at `public/og-default-{de,en}.png`.

### Option A: Branded template

Run:

```bash
pnpm generate-og
```

This writes `public/og-default-de.png` and `public/og-default-en.png` from the project's i18n strings (`site.name`, `site.tagline`), the accent color in `src/styles/global.css`, and the logo in `public/favicon.svg`. If the user has run `/onboard` (so the i18n + accent are theirs) and the favicon is their logo (Step 1 above), the result is on-brand without any prompting.

For per-locale regeneration: `pnpm generate-og --lang de` or `--lang en`.

### Option B: AI generated

Ask: "Describe what you'd like the image to convey — visual style, mood, key elements."

Generate once, then copy to the second locale — `gpt-image-2` is non-deterministic, so two separate calls with the same prompt produce two visually different images. We want DE and EN visitors to see the same artistic image.

```bash
pnpm generate-image "<prompt including company name, brand style, professional look>" -o public/og-default-de.png --size 1536x1024
cp public/og-default-de.png public/og-default-en.png
```

Guidelines for the prompt:

- Include the company name if the user wants text on the image
- Match the site's accent color and visual style
- Ideal OG dimensions: 1200×630. Using 1536x1024 gives good quality; platforms will crop to fit.
- Example prompt: "Professional banner for [Company Name], [industry], accent color #6366f1, clean modern design, suitable as social media preview"

**Remind the user:** This requires `OPENAI_API_KEY` in `.env`.

### Option C: Skip

Move on. The current `public/og-default-{de,en}.png` files stay as they are.

## Step 3: Verify Integration

After assets are created, verify:

1. **Favicon:** `public/favicon.svg` exists and is referenced in `src/layouts/BaseLayout.astro` at:

   ```html
   <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
   ```

   This is already configured in the template (line 94). No changes needed unless the user wants a different path.

2. **OG image:** `public/og-default-de.png` AND `public/og-default-en.png` exist. `src/layouts/BaseLayout.astro` already picks the locale-specific file:

   ```ts
   const defaultOgImage = `/og-default-${lang}.png`;
   ```

   No changes needed unless the user wants a different path. Individual pages can still override via the `ogImage` prop.

3. Run `pnpm build` to confirm no broken asset references.

## Final message

> "Your brand assets are set up:
>
> - **Favicon:** `public/favicon.svg` — appears in browser tabs
> - **OG images:** `public/og-default-de.png` and `public/og-default-en.png` — appear when your site is shared on social media (locale-aware: DE pages get the DE image, EN pages get the EN image)
>
> Individual pages can override the OG image by passing `ogImage` to BaseLayout. To regenerate the branded template later, run `pnpm generate-og`. To run the full brand flow again, use `/brand`."
