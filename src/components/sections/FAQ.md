---
component: FAQ
oneLiner: Accordion of question-and-answer pairs using native HTML details/summary
status: stable
tags: [section]
---

## Purpose

Question-and-answer accordion built on native `<details>` / `<summary>`. No JavaScript, no hydration, works without consent or analytics — just HTML. Rotates a `ChevronDown` icon when an item opens. Migrated from `src/components/FAQs.astro` to the section archetype — now wraps in `<Section padding="lg" container="narrow">` and consumes `FAQProps` from `~/types/sections`.

## When to use

- FAQ pages (or FAQ sections on landing / services pages).
- Inline objection-handling blocks where users may have predictable questions.
- Help / support entries where the answer fits in a short paragraph.

## When NOT to use

- Long-form help content with multiple sub-headings inside an answer — better as separate pages.
- Single Q&A — just render the question and answer as headline and paragraph.
- When you need to deep-link to an open item or animate the expand/collapse — native `<details>` doesn't animate height; the open state is `:target`-able but the implementation here isn't wired for it.

## Props

Consumes `FAQProps` from `~/types/sections` (extends `SectionProps`).

| Prop       | Type                                                 | Required | Default     | Notes                                              |
| ---------- | ---------------------------------------------------- | -------- | ----------- | -------------------------------------------------- |
| `eyebrow`  | `string`                                             | no       | —           | Uppercase tracked label above the section heading. |
| `headline` | `string`                                             | no       | —           | Section `<h2>` in the optional header block.       |
| `lede`     | `string`                                             | no       | —           | Body paragraph under the headline.                 |
| `items`    | `FAQItem[]`                                          | yes      | —           | Each item: `{ question: string; answer: string }`. |
| `align`    | `"start" \| "center"`                                | no       | `"center"`  | Aligns the header block only.                      |
| `tone`     | `"surface" \| "elevated" \| "dark" \| "accent-wash"` | no       | `"surface"` | Passed to `<Section>`.                             |
| `padding`  | `"sm" \| "md" \| "lg"`                               | no       | `"lg"`      | Passed to `<Section>`.                             |

## Example

```astro
---
import FAQ from "~/components/sections/FAQ.astro";
---

<FAQ
  headline="Häufige Fragen"
  items={[
    {
      question: "Wie lange dauert ein typisches Projekt?",
      answer:
        "Von der Discovery bis zum Launch rechnen wir mit 8 bis 12 Wochen — abhängig vom Umfang.",
    },
    {
      question: "Übernehmt ihr auch die laufende Pflege?",
      answer:
        "Ja. Wir bieten Wartungsverträge mit klar definierten Reaktionszeiten.",
    },
  ]}
/>
```

## i18n keys

_None — strings are passed in as props by the calling page._

## Gotchas

- **All items are independently expandable.** There is no `name` attribute on `<details>` to enforce exclusive-open behavior. If you want only one open at a time, add a `name` attribute (one shared value across siblings) — only in browsers supporting the 2023 `details name` attribute.
- **Answers are plain strings, not Markdown.** Newlines and inline formatting won't render. If you need rich answers, swap to a slot or a Markdown-rendered prop.
- **Summary `min-height: 44px` is set for touch compliance.** Don't shrink the padding without checking touch targets.
- **`::-webkit-details-marker` is hidden** to remove the native triangle so the chevron icon is the only affordance.
