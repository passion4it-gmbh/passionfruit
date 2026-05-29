---
component: StructuredData
oneLiner: Injects a Schema.org JSON-LD script tag into the page head
status: stable
tags: [seo]
---

## Purpose

Renders a `<script type="application/ld+json">` tag containing a Schema.org structured data object. Enables rich results in search engines (breadcrumbs, job postings, FAQs, etc.) without any runtime JS overhead.

## When to use

- On any page that has machine-readable entity data to expose (job postings, articles, organizations, FAQs, events).
- Alongside dedicated builder helpers in `src/lib/structured-data.ts` that produce validated Schema.org objects.

## When NOT to use

- For arbitrary JSON embedding — use a native `<script>` tag in the page if the data is not Schema.org.
- More than once per entity type per page — duplicate JSON-LD types can confuse crawlers. Multiple calls are fine for distinct types.

## Props

| Prop   | Type                      | Required | Default | Notes                                                                                                                                         |
| ------ | ------------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `type` | `string`                  | yes      | —       | Schema.org type string (e.g. `"JobPosting"`). Used for documentation only — not injected into output; the `data` object must include `@type`. |
| `data` | `Record<string, unknown>` | yes      | —       | The full Schema.org object to serialize. Must include `@context` and `@type`.                                                                 |

## Example

```astro
---
import StructuredData from "~/components/StructuredData.astro";
import { buildJobPostingLd } from "~/lib/structured-data";

const ld = buildJobPostingLd(entry);
---

<StructuredData type="JobPosting" data={ld} />
```

## i18n keys

None

## Gotchas

- The `type` prop is purely documentary — it does not appear in the rendered output. The `data` object must carry `"@type"` itself.
- `data` is serialized with `JSON.stringify` via `set:html`. Astro's `set:html` is safe here because JSON-LD is not parsed as HTML, but avoid putting user-controlled strings in `data` values without sanitizing.
- Place this component inside `<head>` or at the very top of `<body>` — crawlers expect JSON-LD early in the document.
