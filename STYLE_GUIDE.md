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

### Long-form Markdown (`<Prose>`)

Wrap rendered Markdown bodies in `<Prose>` (from `~/components/Prose.astro`). It caps the reading measure, centers the column, and enables editorial features (hanging punctuation, optional drop cap).

| Prop      | Values                            | When                                                         |
| --------- | --------------------------------- | ------------------------------------------------------------ |
| `dropCap` | `true \| false` (default `false`) | `true` for blog posts; default elsewhere.                    |
| `measure` | `"tight" \| "default" \| "wide"`  | `"wide"` for legal copy; `"default"` (70ch) everywhere else. |

Consumers: `BlogPost`, `LegalDocument`, `PageContent`, `CareerPost`, `EventDetail`, `CaseStudyDetail`, contact page. See `src/components/CLAUDE.md` for the full list and rationale.

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

### Section frame and archetypes

For page sections, use the `Section` frame + an archetype rather than rolling a generic `<section>`. The frame owns tone, padding, and container width; the archetype owns the editorial pattern.

- `<Section>` — tone + padding + container primitive. Wrap a one-off section.
- `<AsymmetricHero>` — 7/5 hero with intentional vertical offset (image-right, image-left, fullbleed).
- `<MagazineGrid>` — editorial 12-col cell grid (small/medium/large spans).
- `<StickyStory>` — pinned copy + scrolling visuals storytelling layout.
- `<EditorialQuote>` — display-sized pull-quote with attribution + optional avatar.
- `<SplitFeature>` — alternating image+text rows for feature lists.
- `<Trust>` — partner/client logo strip (grayscale → color on hover).
- `<Comparison>` — responsive comparison table (semantic on desktop, stacked cards on mobile).
- `<FAQ>` — accordion of question/answer pairs via native `<details>`/`<summary>`.

All archetypes consume the shared `SectionProps` shape (`eyebrow`, `headline`, `lede`, `tone`, `padding`, `align`). Per-component intent — when to reach for one over another, gotchas, exact prop tables — lives in the sidecar `.md` next to each component.

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

**Use when:** entrance choreography on scroll, micro-interactions on hover/press/focus, view-transition affordances. Reach for the existing `.hero-stagger` and `.anim-*` classes — they already carry the easing curves, durations, and reduced-motion gates. Set per-element delays via `style="--delay: ${i * 100}ms"`.

**Don't use when:** custom `@keyframes` without a `prefers-reduced-motion: no-preference` gate. Never use parallax (motion sickness, zero quality lift). Never reach for a JS animation library — CSS animation-timeline + IntersectionObserver fallback cover every case the project has.

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

### Motion primitives

For entrance choreography, use the `Motion` primitive instead of authoring keyframes per-element. The primitive handles the reduced-motion gate, ClientRouter re-init, and IntersectionObserver fallback for you.

- `<Motion effect="fade-up" duration="base">` — explicit form. Configurable `effect` / `duration` / `delay` / `threshold` / `once`.
- `<FadeUp>` — sugar around `<Motion effect="fade-up">`.
- `<FadeIn>` — sugar around `<Motion effect="fade">`.

Effects: `fade`, `fade-up` (+8px), `fade-down` (-8px), `scale-in` (0.96). Durations: `instant` (80ms) / `quick` (150ms) / `base` (240ms) / `slow` (400ms). All reach the target state immediately under `prefers-reduced-motion: reduce` — no animation, no opacity fade.

For storytelling layouts that depend on scroll position (`StickyStory`), the motion adapter ships inside the section archetype itself — you don't wire it manually.

### Pattern vs. anti-pattern

**Don't** — keyframes that play unconditionally:

```css
@keyframes slide-in {
  from {
    transform: translateY(32px);
  }
  to {
    transform: translateY(0);
  }
}
.my-reveal {
  animation: slide-in 600ms ease-out both;
}
```

**Do** — gate the motion, leave the target state as the fallback:

```css
.my-reveal {
  transform: translateY(0);
}
@media (prefers-reduced-motion: no-preference) {
  @keyframes slide-in {
    from {
      transform: translateY(32px);
    }
    to {
      transform: translateY(0);
    }
  }
  .my-reveal {
    animation: slide-in 600ms ease-out both;
  }
}
```

---

## 7. Dark Sections

**Use when:** framing a section on the dark surface (`--color-surface-dark`) — hero, footer, CTA bands, any "negative space" block in the page rhythm. Text routes through `--color-text-on-dark`; backgrounds layer noise, grid, and glow orbs to add depth.

**Don't use when:** `color: white` (or `text-white`) on a dark section. Always route through the on-dark token so `/onboard` recolorings propagate. Don't drop the `.noise` + `.bg-grid` layers either — a flat dark surface looks cheap.

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

### Pattern vs. anti-pattern

**Don't** — hardcoded white that won't follow brand changes:

```html
<section class="bg-surface-dark">
  <h2 style="color: white">Headline</h2>
</section>
```

**Do** — token-backed on-dark text:

```html
<section class="bg-surface-dark noise relative overflow-hidden">
  <h2 class="text-on-dark">Headline</h2>
</section>
```

---

## 8. Accessibility

**Use when:** any element with `aria-*`, `role=`, `alt=`, or interactive semantics — buttons, links, form fields, custom widgets. WCAG AA is the floor, not the ceiling. The `passionfruit-a11y` skill auto-loads on these edits; this section is the canonical reference behind it.

**Don't use when:** missing alt text on `<img>` / `<Image>` (the build fails — `jsx-a11y/alt-text` is error-level). Don't treat decorative imagery as informational, don't suppress the `:focus-visible` ring without providing a custom one, don't ship interactive `<div>`s.

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

### Pattern vs. anti-pattern

**Don't** — no alt text (the build will fail) and no accessible name on an icon-only button:

```
<img src={hero} />
<button><Search class="w-5 h-5" /></button>
```

**Do** — informational alt or `alt=""` for decorative, plus an `aria-label` on icon-only triggers:

```
<Image src={hero} alt="Team workshopping a customer journey on a whiteboard" />
<button aria-label="Search"><Search class="w-5 h-5" /></button>
```

---

## 9. Icons & Images

**Use when:** adding an icon (import from `@lucide/astro`) or a brand/content image (`<Image>` from `astro:assets`, with an imported asset reference). Use the size scale below for icons and the aspect/treatment table for images.

**Don't use when:** emojis in place of icons (the project is icon-only), raw `<img>` tags for project assets (loses Astro's AVIF/WebP generation and responsive sizing), or icon-only buttons without an `aria-label`.

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

### Pattern vs. anti-pattern

**Don't** — raw `<img>` with a string path (no AVIF/WebP, no responsive sizing):

```
<img src="/blog/post.png" alt="Post hero" />
```

**Do** — Astro's `<Image>` with an imported asset, which generates AVIF + WebP automatically:

```
---
import postImg from '~/assets/blog/post.png';
import { Image } from 'astro:assets';
---
<Image src={postImg} alt="Post hero" />
```

---

## 10. Social proof

**Use when:** displaying testimonials, partner/client logos, or feature comparisons. Use `<Trust>` (`sections/Trust`) for logo strips and `<Comparison>` (`sections/Comparison`) for feature grids — both already encode the patterns below.

**Don't use when:** generic praise without attribution (testimonial loses credibility), partner logos at inconsistent heights (band reads as visual noise), or boolean comparison cells rendered as bare "Yes/No" text without a screen-reader label.

### Logo strips (`<Trust>`)

Partner/client logos use a **grayscale-rest / color-hover** pattern:

- Default state: `opacity-50 grayscale` — logos recede into the background, reducing visual noise.
- Hover/focus state: `opacity-100 grayscale-0` with `transition-all duration-300` — logos snap to full color on interaction.
- Keep logo height uniform at `h-10` (40px) so the strip reads as a cohesive band regardless of aspect ratio.
- Never add decorative borders or drop-shadows to logos — let the grayscale treatment do the work.

### Comparison tables (`<Comparison>`)

Feature comparison grids follow a **semantic table on desktop, per-column cards on mobile** pattern:

- Desktop: `<table>` with `scope` attributes, `border-collapse`, `rounded-xl border border-border` container.
- Mobile (`md:hidden`): one card per column, rows repeated inside each card — no horizontal scroll ever.
- Highlighted column: `bg-accent/5` fill + `ring-1 ring-inset ring-accent/20` border. One highlight max per table.
- Boolean cells: `<Check class="text-accent">` for true, `<X class="text-muted">` for false — never raw "Yes/No" text without a screen-reader label.
- Zebra striping on desktop rows: even rows `bg-surface-elevated`, odd rows `bg-surface`.

### Pattern vs. anti-pattern

**Don't** — free-floating logos at inconsistent sizes, treated as decorative:

```
<div class="flex gap-8">
  <img src="/logos/a.svg" />
  <img src="/logos/b.svg" style="height: 56px" />
</div>
```

**Do** — the `<Trust>` component with a uniform height and the grayscale pattern baked in:

```
<Trust logos={partners} />
```

---

## 11. Media embeds

**Use when:** embedding any third-party video or audio (YouTube, Spotify, and the additional providers as they appear). Always go through the facade component (`<YouTubeFacade>`, `<SpotifyFacade>`) — a static poster + Play button, with the real iframe injected only on click.

**Don't use when:** raw `<iframe>` to a third-party host. It skips the consent gate, fires tracking pixels on passive page view, and bloats LCP because the iframe and its sub-resources land on the critical path.

Facades exist for two reasons:

- **Privacy:** no third-party requests, cookies, or tracking pixels fire before user intent — nothing to consent-gate on a passive page view.
- **Performance:** the heavy iframe and its sub-resources never touch the critical path; LCP stays a local image.

### Rules

- **Never embed YouTube, Spotify, Vimeo, etc. with a raw `<iframe>`.** Facades exist precisely to keep third-party connections gated behind user intent — bypassing them defeats both reasons above.
- **`youtube-nocookie.com` is non-negotiable** for YouTube. Don't switch back to `youtube.com/embed` — it sets cookies before consent.
- **CSP is scoped per provider** in `public/_headers`. Adding a new provider (Vimeo, SoundCloud, …) means a new facade **and** a CSP update for that provider's `frame-src`/`img-src`/`media-src` — never loosen the policy to "fix" a blocked embed in DevTools.
- **Posters are local `ImageMetadata`**, not remote URLs — `astro:assets` optimizes them and serves from the same origin.

### Pattern vs. anti-pattern

**Don't** — raw third-party iframe, fires on page load, ignores consent:

```html
<iframe
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  allow="autoplay"
></iframe>
```

**Do** — the facade, which defers the real iframe until the user clicks Play:

```
<YouTubeFacade videoId="dQw4w9WgXcQ" poster={posterImg} title="…" />
```

Component usage (props, examples, locale wiring) lives in [`src/components/CLAUDE.md`](./src/components/CLAUDE.md) — Claude Code auto-loads it when working in that directory.

---

## 12. State surfaces

**Use when:** rendering a loading placeholder, an empty results state, or an inline error/warning surface. The primitives in `src/components/state/` carry the visual contract — shimmer animation, illustration slot, tone-aware coloring — so consumers don't re-roll them.

**Don't use when:** rendering a generic gray block instead of a content-shape-matched skeleton (looks worse than no skeleton); leaving an empty state with no call-to-action (dead end); throwing raw red text with an asterisk for form errors (no semantic, no tone, no retry path).

### Loading (`<Skeleton>`)

Shimmer placeholder for content not yet loaded. Variants match the shape of the eventual content: `text` (line-height-matched, optional multi-line), `card` (aspect-ratio 4/3), `image` (caller-sized), `circle` (avatars).

```
<Skeleton variant="text" lines={3} />
<Skeleton variant="card" />
<Skeleton variant="circle" width="3rem" height="3rem" />
```

Shimmer is gated behind `prefers-reduced-motion: no-preference`; under reduced motion the skeleton remains visible as a static stripe. `role="status"` and a visually-hidden "Loading…" string ship by default.

### Empty (`<EmptyState>`)

Empty results placeholder. `headline` + `body` + `cta` are all required — the CTA is mandatory because dead-end empty states leave the visitor stranded. Optional `illustration` slot; falls back to a muted lucide `Inbox`.

```
<EmptyState
  headline={t("state.empty.filters.headline")}
  body={t("state.empty.filters.body")}
  cta={{ label: t("state.empty.filters.cta"), href: baseUrl }}
/>
```

Wired into `CollectionFilter` for zero-results on tag/category filters.

### Error (`<ErrorState>`)

Inline error / warning / info surface. `tone` picks the visual and the lucide icon. Background uses a low-opacity `color-mix` of the tone token; border uses the full-opacity token. Retry, when present, is a link (no JS handlers — static site).

```
<ErrorState
  tone="error"
  headline="Konnte Formular nicht senden"
  body="Versuche es in einer Minute noch einmal."
  retry={{ label: "Erneut versuchen", href: "/kontakt/" }}
/>
```

`role="alert"` + `aria-live="assertive"` for `tone="error"`; `role="status"` + polite for `warning`/`info`.

### Pattern vs. anti-pattern

**Don't** — generic gray block as a "loading skeleton" that doesn't match the eventual content shape:

```html
<div class="h-32 w-full bg-gray-200 animate-pulse"></div>
```

**Do** — line-height-matched text skeleton that reads as the prose it replaces:

```
<Skeleton variant="text" lines={3} />
```

---

## Decision Shortcuts

When you reach one of these decision points, take the shortcut.

| Situation                                                                   | Shortcut                                                                                                                         |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Need a CTA                                                                  | `<Button variant="primary\|secondary\|ghost" tone="on-light\|on-dark" href="…">…</Button>`                                       |
| Need a color                                                                | Check `@theme` in `src/styles/global.css` first. If missing, add a `--color-*` token there; never hex.                           |
| Need a font size                                                            | `--text-*` token (or matching `.text-*` utility). Never raw `font-size: Xrem`.                                                   |
| Need to display a blog / team / career / case-study / event entry as a card | Use the per-type card (`BlogCard`, `TeamCard`, `CareerCard`, `CaseStudyCard`, `EventCard`).                                      |
| Need to embed a YouTube or Spotify video                                    | Use the facade (`<YouTubeFacade>` / `<SpotifyFacade>`), never a raw `<iframe>`.                                                  |
| Need long-form Markdown rendering                                           | Use the existing `BlogPost` / `PageContent` / `LegalDocument` patterns; don't re-roll prose styling.                             |
| Need an icon                                                                | Import from `@lucide/astro`. Never an emoji.                                                                                     |
| Need to add a third-party host (script, iframe, font, asset)                | Update `public/_headers` CSP first, then add the resource. Forgotten CSPs silently block in production.                          |
| Need to add a translation string                                            | Edit both `src/i18n/de.json` and `src/i18n/en.json` together (the `passionfruit-content` skill reminds you).                     |
| Need an animation                                                           | CSS keyframes inside a `@media (prefers-reduced-motion: no-preference)` block. No JS animation libs.                             |
| Need a section frame                                                        | `<Section tone="..." padding="..." container="...">` or pick the right archetype from `sections/`.                               |
| Need an editorial section pattern (hero / quote / grid)                     | Use the archetype — `AsymmetricHero`, `MagazineGrid`, `StickyStory`, `EditorialQuote`, `SplitFeature`. Don't compose one ad-hoc. |
| Need an entrance animation primitive                                        | `<Motion effect="fade-up">` (or the `<FadeUp>` / `<FadeIn>` sugars). Don't author per-element keyframes.                         |
| Need a loading skeleton / empty state / error surface                       | `<Skeleton variant="...">`, `<EmptyState>`, `<ErrorState tone="...">`. Don't roll your own gray box.                             |

If you don't see your situation here, ask. Don't guess.
