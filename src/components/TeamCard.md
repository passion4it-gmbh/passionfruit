---
component: TeamCard
oneLiner: Profile card for a team member with photo, role, specializations, and socials
status: stable
tags: [card]
---

## Purpose

Renders a team member profile card. Shows a 4:3 photo (or an initial-letter avatar when no photo is provided), the member's name, role, specialization badges, and optional social links (LinkedIn, GitHub, website). The card is non-clickable — it presents information rather than navigating.

## When to use

Use on team/about pages to list all team members. Pass entries from `getCollection("team")` filtered to the current locale.

## When NOT to use

Do not use in marketing sections with logo grids — use `TrustSection` for client/partner logos. Do not use when linking to a full profile detail page; if a detail page exists, add a link wrapper at the caller level.

## Props

| Prop    | Type                      | Required | Notes                                                            |
| ------- | ------------------------- | -------- | ---------------------------------------------------------------- |
| `entry` | `CollectionEntry<"team">` | yes      | Team collection entry for the current locale.                    |
| `lang`  | `Locale`                  | yes      | Required by the component interface; currently not used for t(). |

## Example

```astro
---
import { getCollection } from "astro:content";
import TeamCard from "~/components/TeamCard.astro";

const lang = "en";
const members = await getCollection("team", ({ id }) =>
  id.startsWith(`${lang}/`),
);
const sorted = members.sort(
  (a, b) => a.data.displayOrder - b.data.displayOrder,
);
---

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {sorted.map((member) => <TeamCard entry={member} lang={lang} />)}
</div>
```

## i18n keys

None. The component reads directly from `entry.data` fields (name, role, specializations, socials) and does not call `useTranslations` or `t()`. Social link `aria-label` strings are hardcoded in English (`"{name} on LinkedIn"`, etc.).

## Gotchas

- **Photo is optional.** When `entry.data.photo` is absent, a gradient placeholder with a large initial letter is shown instead. Ensure the `name` field is always non-empty.
- **Alt text is the member's name.** The `<Image>` component uses `alt={name}`. Keep team member names in the collection, not just a `photo` field.
- **Social links have 44px touch targets.** The `min-h-[44px]` class is applied on each social anchor. Do not reduce the padding when customizing.
- **`lang` is declared in `Props` but not used in template logic.** The field is kept for interface consistency across card components and to future-proof localized social label text.
- **`displayOrder` sorting is the caller's responsibility.** The card itself does not sort — call `.sort((a, b) => a.data.displayOrder - b.data.displayOrder)` before mapping.
