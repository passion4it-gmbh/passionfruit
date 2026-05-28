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

Ask:

> "What should your social media preview image look like? This appears when someone shares a link to your site on LinkedIn, Twitter, etc. Describe what you'd like, or I can generate something based on your brand."

Generate via:

```bash
pnpm generate-image "<prompt including company name, brand style, professional look>" -o public/og-default.png --size 1536x1024
```

Guidelines for the prompt:

- Include the company name if the user wants text on the image
- Match the site's accent color and visual style
- Ideal OG dimensions: 1200x630. Using 1536x1024 gives good quality; platforms will crop to fit.
- Example prompt: "Professional banner for [Company Name], [industry], accent color #6366f1, clean modern design, suitable as social media preview"

**Remind the user:** This also requires `OPENAI_API_KEY` in `.env`.

If the user wants to skip, the default `public/og-default.png` will be used.

## Step 3: Verify Integration

After assets are created, verify:

1. **Favicon:** `public/favicon.svg` exists and is referenced in `src/layouts/BaseLayout.astro` at:

   ```html
   <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
   ```

   This is already configured in the template (line 94). No changes needed unless the user wants a different path.

2. **OG image:** `public/og-default.png` exists and is the default in `src/layouts/BaseLayout.astro`:

   ```ts
   const defaultOgImage = "/og-default.png";
   ```

   This is already configured (line 37). Individual pages can override via the `ogImage` prop.

3. Run `pnpm build` to confirm no broken asset references.

## Final message

> "Your brand assets are set up:
>
> - **Favicon:** `public/favicon.svg` — appears in browser tabs
> - **OG image:** `public/og-default.png` — appears when your site is shared on social media
>
> Individual pages can override the OG image by passing `ogImage` to BaseLayout. To update these later, just run `/brand` again."
