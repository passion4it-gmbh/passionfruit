# Visual Style Guide

You will be auto-loaded into context by the `passionfruit-design` skill when editing any `.astro` or `.css` file. This is the single source of truth for tokens, patterns, and primitive selection. When you reach a decision point, scan the **Decision Shortcuts** cheat sheet at the bottom first — if your situation appears there, take the shortcut. If it doesn't, read the relevant section above and ask before guessing.

If something contradicts this guide, this guide wins.

---

## Design Philosophy

Premium, confident, modern — intentional, not sterile, not flashy. Depth comes from layering (glow orbs, noise, glass, gradient meshes), not from hex literals scattered across components. Generous spacing and restraint signal confidence; every page should look so good a small business wants to copy it 1:1. Never reach for the generic AI aesthetic (floating dashboards, gradient blobs, "AI brain" imagery).

---

## 1. Color System

**Use when:** picking a foreground color, background tone, accent, border, or overlay — anything that paints pixels. Reach for the `--color-*` token (or the Tailwind utility that maps to it) defined in `src/styles/global.css` `@theme`.

**Don't use when:** raw hex literals in components. If the color you need isn't a token yet, add it to `@theme` first so `/onboard` can re-skin it. Don't reach for raw `rgba(...)` for scrims and shadow lifts either — those have dedicated tokens.

### Core Tokens

| Token                           | Hex       | Purpose                                   |
| ------------------------------- | --------- | ----------------------------------------- |
| `--color-surface`               | `#fafbfc` | Page background (not pure white)          |
| `--color-surface-elevated`      | `#ffffff` | Cards, elevated surfaces                  |
| `--color-surface-dark`          | `#0c0c1d` | Dark sections, heroes, footer             |
| `--color-surface-dark-elevated` | `#14142b` | Elevated dark surfaces                    |
| `--color-text`                  | `#3d4156` | Body text                                 |
| `--color-text-heading`          | `#12132d` | Headings (near-black with blue tint)      |
| `--color-text-on-dark`          | `#f0f0f5` | Text on dark backgrounds                  |
| `--color-accent`                | `#6366f1` | Primary accent (swappable via `/onboard`) |
| `--color-accent-hover`          | `#4f46e5` | Hover state                               |
| `--color-accent-glow`           | `#818cf8` | Lighter accent for glows and gradients    |
| `--color-warm`                  | `#f59e0b` | Warm accent (from passionfruit flesh)     |
| `--color-border`                | `#e2e4eb` | Borders, dividers                         |
| `--color-muted`                 | `#6b7280` | Secondary text, captions                  |

Overlay scrims and shadow lifts have their own tokens (`--color-overlay-scrim-*`, `--color-shadow-lift`) — use those instead of hand-rolled `rgba()`.

### Usage Rules

- Dark sections: `bg-surface-dark` with `.noise` overlay and `.bg-grid` pattern
- Glow orbs: `bg-accent/15 blur-[120px]` or `bg-warm/10 blur-[100px]`
- Glass on dark: `.glass` class (white/5 bg, blur-20, white/8 border)
- Glass on light: `.glass-light` class (white/65 bg, blur-20)
- Gradient text: `.gradient-text` (accent-glow → accent → warm)

### Pattern vs. anti-pattern

**Don't** — raw hex bypasses theme swaps:

```html
<p style="color: #6b7280">Caption</p>
```

**Do** — token-backed utility, re-skinnable by `/onboard`:

```html
<p class="text-muted">Caption</p>
```

**Don't** — hand-rolled scrim:

```css
background: rgba(12, 12, 29, 0.6);
```

**Do** — dedicated overlay token:

```css
background: var(--color-overlay-scrim-strong);
```

---

## 2. Typography

**Use when:** sizing any text — pick a `--text-*` fluid token (or the matching `.text-*` utility class), pair it with a `--leading-*` line-height, and pick a tracking token for headings. Inter Variable handles every weight; self-hosted via `@fontsource-variable/inter`.

**Don't use when:** inline `font-size: Xrem` literals. The fluid clamp scale exists so a single token covers mobile-to-desktop without media queries — fixed `rem` literals break that. Don't use ALL CAPS outside the `.eyebrow` utility.

### Fluid Type Scale (clamp)

| Utility         | Range               | Usage                       |
| --------------- | ------------------- | --------------------------- |
| `.text-display` | 3rem – 5.5rem       | Hero headlines, 404 numbers |
| `.text-h1`      | 2.25rem – 3.5rem    | Page titles, CTA headlines  |
| `.text-h2`      | 1.75rem – 2.75rem   | Section headings            |
| `.text-h3`      | 1.25rem – 1.75rem   | Card titles, subsections    |
| `.text-body-lg` | 1.0625rem – 1.25rem | Lead paragraphs, subtitles  |

### Tracking

| Token                | Value    | Usage               |
| -------------------- | -------- | ------------------- |
| `--tracking-tight`   | -0.025em | Headings (h2, h3)   |
| `--tracking-tighter` | -0.04em  | h1                  |
| `--tracking-display` | -0.05em  | Display text (hero) |

### Rules

- Sentence case throughout — no ALL CAPS except `.eyebrow` labels
- Eyebrow: `.eyebrow` class (0.8125rem, 600 weight, 0.08em tracking, uppercase, accent color)
- Line-height: 1.05 display, 1.15 headings, 1.6 body, 1.7 body-lg

### Pattern vs. anti-pattern

**Don't** — fixed size, breaks fluidly at every breakpoint you forget to handle:

```html
<h1 style="font-size: 2rem">Title</h1>
```

**Do** — fluid token, mobile-to-desktop in one line:

```html
<h1 class="text-h1">Title</h1>
```

---

## 3. Buttons

**Use when:** rendering a CTA — anything the user clicks to do a thing (submit, navigate to a key destination, trigger an action). Pick one of three variants (`primary`, `secondary`, `ghost`) crossed with a tone (`on-light`, `on-dark`). Use the `<Button>` component with either `<a>` or `<button>` semantics; never re-roll one.

**Don't use when:** inline text links inside paragraphs (use a plain styled `<a>`), nav-bar links (use a bare `<a>`), or icon-only triggers without an `aria-label`. Don't style a `<div>` to look like a button — it loses keyboard semantics.

| Variant   | On light                            | On dark                     |
| --------- | ----------------------------------- | --------------------------- |
| Primary   | Accent bg, white text               | Accent bg, white text       |
| Secondary | Border + transparent, heading color | Border white/20, white text |
| Ghost     | Accent text, underline hover        | White text, underline hover |

### Enhancements

- `.btn-glow`: gradient hover effect (accent-glow → accent → accent-hover)
- Arrow icons: `<ArrowRight>` with `group-hover:translate-x-1` transition
- Minimum touch target: 44px, border-radius: `var(--radius-md)` (12px)
- Always `focus-visible:ring-2 ring-accent ring-offset-2`

### Pattern vs. anti-pattern

**Don't** — styled `<a>` mimicking a button (drifts from the system on every restyle, no shared tone logic):

```
<a href="/contact" class="rounded-md bg-accent px-6 py-3 text-white">
  Contact us
</a>
```

**Do** — the canonical component:

```
<Button variant="primary" tone="on-light" href="/contact">Contact us</Button>
```

---

## 4. Cards

**Use when:** displaying an entry from a content collection — blog post, team member, career, case study, event. Use the per-type component (`BlogCard`, `TeamCard`, …). For decorative tile-like content inside a section (values, features, stats), the `.card` global utility is fine.

**Don't use when:** wrapping arbitrary content in a generic `<Card>`. passionfruit deliberately has one card per content type — that's how design intent (image ratios, badge placement, hover behavior) stays consistent. If a new content type appears, add a new card component; don't shoehorn into an existing one.

### `.card` (global.css)

- Background: `--color-surface-elevated`, radius: `--radius-xl` (1.5rem), padding: 2rem
- Hover: accent-tinted border via `color-mix()`, subtle `shadow-accent/8`
- `p-0 overflow-hidden` variant for image-topped cards (BlogCard, TeamCard)

### `.glass` (dark sections)

- `rgba(255,255,255,0.05)`, `backdrop-blur: 20px`, `saturate: 180%`
- Border: `rgba(255,255,255,0.08)`, radius: `--radius-card`

### Content Cards

- **BlogCard**: full-bleed image with hover zoom (scale-105), date+tags, title, excerpt, "Read more" arrow. Entire card is `<a>`.
- **TeamCard**: 4:3 photo with hover zoom, name/role, specialization badges, social links with border-t separator
- **Value card**: horizontal layout — icon container left, text right

### Pattern vs. anti-pattern

**Don't** — ad-hoc card markup duplicating what the per-type component owns:

```
<div class="card">
  <img src={post.image} alt="" />
  <h3>{post.title}</h3>
  <p>{post.excerpt}</p>
</div>
```

**Do** — the per-type component, which carries image ratio, hover behavior, link semantics, and a11y:

```
<BlogCard post={post} locale={locale} />
```

---

## 5. Layout

**Use when:** framing a section, wrapping page content in a container, or choosing a grid pattern. Section padding comes from the rhythm utilities (`py-28 md:py-36` standard, hero overrides below). Container max-width and gutters are fixed — use the `.container` utility or the existing wrapper components.

**Don't use when:** hardcoded `padding: 4rem` literals or arbitrary `max-w-*` values without checking the existing tokens first. The container width is deliberately narrower than Tailwind's default `max-w-7xl` — overriding it visually drifts pages out of the system.

### Container

- Max-width: `76rem` (1216px)
- Padding: `1.25rem` mobile → `1.5rem` sm → `2.5rem` lg

### Section Spacing

- Standard: `py-28 md:py-36`
- Hero: `pt-32 pb-24 md:pt-40 md:pb-32`
- Between hero content blocks: `mt-6` for text, `mt-10` for CTAs

### Page Structure Pattern

Every page follows: **Dark hero** → **Content sections** → **CTA** → **Footer**

### Responsive Breakpoints

| Prefix | Width                  |
| ------ | ---------------------- |
| (none) | < 640px (mobile-first) |
| `sm:`  | 640px                  |
| `md:`  | 768px                  |
| `lg:`  | 1024px                 |

### Grid Patterns

- Feature cards: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`
- Text + visual: `grid lg:grid-cols-2 gap-12 lg:gap-20 items-center`
- Stats bar: `grid grid-cols-2 md:grid-cols-4 gap-8`
- Value cards: `grid gap-6 sm:grid-cols-2`

### Pattern vs. anti-pattern

**Don't** — arbitrary literals that drift from the rhythm and width system:

```html
<section class="py-20">
  <div class="mx-auto max-w-7xl px-4">…</div>
</section>
```

**Do** — token-backed rhythm and the project container:

```html
<section class="py-28 md:py-36">
  <div class="container">…</div>
</section>
```

---

## 6. Animations

### Hero (time-based, always plays)

`.hero-stagger` with `--delay` CSS variable. Stagger: 100ms eyebrow → 200ms title → 400ms subtitle → 600ms CTAs.

Animation: `translateY(20px) + blur(4px)` → visible, via `cubic-bezier(0.16, 1, 0.3, 1)` (spring easing).

### Scroll-driven (CSS animation-timeline)

Native `animation-timeline: view()` in Chrome 115+, IntersectionObserver fallback for all browsers.

| Class              | Effect                                 | Usage                           |
| ------------------ | -------------------------------------- | ------------------------------- |
| `.anim-scale-blur` | Scale 0.92 + blur 8px → visible        | CTA sections, key reveals       |
| `.anim-slide-up`   | TranslateY 32px → visible              | Section headings, text blocks   |
| `.anim-card-enter` | TranslateY 20px + scale 0.97 → visible | Cards, staggered with `--delay` |
| `.anim-fade`       | Opacity 0 → 1                          | Subtle reveals                  |

Stagger cards with `style="--delay: ${i * 100}ms"`.

### Decorative

- `.glow-orb`: 8s pulse animation (scale + opacity), `animation-delay` for variety
- Image hover zoom: `transition-transform duration-500 group-hover:scale-105`
- Button arrow: `transition-transform group-hover:translate-x-1`

### Reduced Motion

All animations respect `prefers-reduced-motion: reduce` — durations collapse to 0.01ms.

---

## 7. Dark Sections

Every dark section uses this stack:

```html
<section class="bg-surface-dark noise relative overflow-hidden">
  <div class="absolute inset-0 bg-grid opacity-20"></div>
  <div class="glow-orb absolute ... bg-accent/15 blur-[120px]"></div>
  <div class="container relative z-10 ...">
    <!-- content -->
  </div>
</section>
```

- `.noise`: subtle SVG noise texture overlay at 1.5% opacity
- `.bg-grid`: 60px grid lines at 3% accent opacity
- Glow orbs: 400-500px blurred circles, positioned at edges/corners, pulsing

---

## 8. Accessibility

WCAG AA minimum.

- Semantic HTML: `<section>`, `<nav>`, `<main>`, `<article>`
- Skip-link: `<a href="#main-content">` before header
- Heading hierarchy: h1 → h2 → h3 (never skip)
- `<html lang>` set per locale
- Touch targets: 44px minimum
- Focus: `focus-visible:ring-2 ring-accent ring-offset-2`
- `prefers-reduced-motion` respected throughout
- `aria-expanded`, `aria-label`, `aria-controls` on interactive elements
- Color contrast: 4.5:1 body, 3:1 large text
- `::selection` styled to accent color

---

## 9. Icons & Images

**Icons**: Lucide only via `@lucide/astro`. Standard sizes: `w-4 h-4` inline, `w-5 h-5` buttons, `w-6 h-6` features.

Icon container: `w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center`

**Images**: `<Image>` from `astro:assets` always. Generate via `pnpm generate-image`.

| Context          | Aspect        | Treatment                                       |
| ---------------- | ------------- | ----------------------------------------------- |
| Hero background  | 3:2 landscape | Faded behind gradient, opacity-15 to opacity-40 |
| Blog card        | 16:10         | Full-bleed, hover zoom                          |
| Blog detail hero | 3:2           | Faded behind dark gradient                      |
| Team photo       | 4:3           | Object-cover object-top, hover zoom             |
| OG image         | 1200×630      | Brand gradient + text                           |

---

## 10. Social proof

### Logo strips (`TrustSection`)

Partner/client logos use a **grayscale-rest / color-hover** pattern:

- Default state: `opacity-50 grayscale` — logos recede into the background, reducing visual noise.
- Hover/focus state: `opacity-100 grayscale-0` with `transition-all duration-300` — logos snap to full color on interaction.
- Keep logo height uniform at `h-10` (40px) so the strip reads as a cohesive band regardless of aspect ratio.
- Never add decorative borders or drop-shadows to logos — let the grayscale treatment do the work.

### Comparison tables (`ComparisonTable`)

Feature comparison grids follow a **semantic table on desktop, per-column cards on mobile** pattern:

- Desktop: `<table>` with `scope` attributes, `border-collapse`, `rounded-xl border border-border` container.
- Mobile (`md:hidden`): one card per column, rows repeated inside each card — no horizontal scroll ever.
- Highlighted column: `bg-accent/5` fill + `ring-1 ring-inset ring-accent/20` border. One highlight max per table.
- Boolean cells: `<Check class="text-accent">` for true, `<X class="text-muted">` for false — never raw "Yes/No" text without a screen-reader label.
- Zebra striping on desktop rows: even rows `bg-surface-elevated`, odd rows `bg-surface`.

---

## 11. Media embeds

Third-party video and audio embeds load through **facade components** — a static poster + Play button, with the real iframe injected only on click. Two reasons:

- **Privacy:** no third-party requests, cookies, or tracking pixels fire before user intent — nothing to consent-gate on a passive page view.
- **Performance:** the heavy iframe and its sub-resources never touch the critical path; LCP stays a local image.

### Rules

- **Never embed YouTube, Spotify, Vimeo, etc. with a raw `<iframe>`.** Facades exist precisely to keep third-party connections gated behind user intent — bypassing them defeats both reasons above.
- **`youtube-nocookie.com` is non-negotiable** for YouTube. Don't switch back to `youtube.com/embed` — it sets cookies before consent.
- **CSP is scoped per provider** in `public/_headers`. Adding a new provider (Vimeo, SoundCloud, …) means a new facade **and** a CSP update for that provider's `frame-src`/`img-src`/`media-src` — never loosen the policy to "fix" a blocked embed in DevTools.
- **Posters are local `ImageMetadata`**, not remote URLs — `astro:assets` optimizes them and serves from the same origin.

Component usage (props, examples, locale wiring) lives in [`src/components/CLAUDE.md`](./src/components/CLAUDE.md) — Claude Code auto-loads it when working in that directory.
