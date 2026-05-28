---
component: FAQs
oneLiner: Accordion list of question-and-answer pairs using native HTML details/summary
status: stable
tags: [section]
---

## Purpose

Renders a vertical stack of expandable FAQ items using native `<details>` / `<summary>` elements. Each item shows a question as the summary and the answer in the expanded panel. The chevron rotates 180° on open via a CSS `details[open]` rule. No JavaScript required.

## When to use

Use anywhere a list of frequently asked questions needs to be displayed — service pages, landing pages, support sections. Pass the items array directly from page data or hardcoded in the parent component.

## When NOT to use

Do not use for navigation menus or disclosure widgets that require rich interactive state (ARIA roles, focus management, etc.). For those, reach for a dedicated React component. Do not use this component when answers need to contain embedded components — `answer` is a plain string.

## Props

| Prop    | Type                                          | Required | Notes                                     |
| ------- | --------------------------------------------- | -------- | ----------------------------------------- |
| `items` | `Array<{ question: string; answer: string }>` | yes      | Non-empty array of FAQ entries to render. |

## Example

```astro
---
import FAQs from "~/components/FAQs.astro";

const items = [
  {
    question: "What services do you offer?",
    answer: "We offer web design, development, and digital marketing services.",
  },
  {
    question: "How long does a project take?",
    answer: "Most projects are completed within four to eight weeks.",
  },
];
---

<section class="container section">
  <h2 class="text-h2 text-text-heading mb-8">FAQ</h2>
  <FAQs {items} />
</section>
```

## i18n keys

None. The component renders `item.question` and `item.answer` verbatim. All content comes from the caller — build the items array with translated strings in the parent component.

## Gotchas

- **Plain-text answers only.** The `answer` property is rendered as a text node inside a `<div>`. HTML markup or embedded components inside `answer` will appear as raw strings — not parsed. If rich content is needed, redesign the data shape and use a slot pattern instead.
- **Native `<details>` behavior.** Only one item can be open at a time in browsers that implement exclusive accordion mode (Chrome 120+). In other browsers multiple items can be open simultaneously. This is browser-native behavior — do not work around it with JavaScript unless exclusive-open is a hard requirement.
- **Animation uses CSS only.** The chevron rotation is driven by `details[open] .faq-chevron { transform: rotate(180deg) }`. There is no height animation on the panel — browsers animate `<details>` differently across platforms. Accept this limitation or override in the parent with a scroll-driven animation.
- **`focus-visible` ring is on the `<summary>`.** The outline is `focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent`. Do not remove `focus-visible` styling when customizing.
