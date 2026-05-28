---
name: new-team-member
description: Add a new bilingual team member with proper frontmatter and both DE/EN files.
---

# Add a New Team Member

Create a bilingual (DE + EN) team member entry with correct frontmatter, placeholder bio, and a commit.

## Gather info

Ask these ONE AT A TIME using the AskUserQuestion tool:

1. "What's their name?"
2. "What's their role/title?" (will be translated for both locales)
3. "What are their specializations? (e.g., Frontend, TypeScript, UI/UX, Strategy)" (will be translated for both locales)
4. "LinkedIn URL? (optional — press enter to skip)"

## Generate identifiers

- `translationKey`: kebab-case from the name, ASCII-only (e.g., "anna-mueller" for "Anna Müller")
- DE/EN slug: same as translationKey (team member slugs are identical across locales)
- Photo name: first name, lowercase, ASCII (e.g., "anna")

## Determine displayOrder

Read all existing files in `src/content/team/de/` and find the highest `displayOrder` value. Set the new member's `displayOrder` to that value + 1.

## Translate role and specializations

Provide natural translations for both locales. Examples:

| DE                      | EN                     |
| ----------------------- | ---------------------- |
| Geschäftsführerin       | CEO                    |
| Lead Entwickler         | Lead Developer         |
| Designerin              | Designer               |
| Frontend                | Frontend               |
| Strategie               | Strategy               |
| Digitale Transformation | Digital Transformation |
| UI/UX                   | UI/UX                  |
| Branding                | Branding               |

If the user gave the role/specializations in one language, translate for the other.

## Create the files

### `src/content/team/de/<slug>.md`

```markdown
---
translationKey: "<translationKey>"
name: "<name>"
role: "<German role>"
displayOrder: <next number>
specializations: ["<DE specializations>"]
photo: "../../../assets/team/<photo-name>.png"
socials:
  linkedin: "<url if provided>"
---

<Name> ist ein neues Mitglied unseres Teams. Ersetzen Sie diesen Text durch eine persönliche Biografie.
```

### `src/content/team/en/<slug>.md`

```markdown
---
translationKey: "<translationKey>"
name: "<name>"
role: "<English role>"
displayOrder: <next number>
specializations: ["<EN specializations>"]
photo: "../../../assets/team/<photo-name>.png"
socials:
  linkedin: "<url if provided>"
---

<Name> is a new member of our team. Replace this text with a personal bio.
```

If no LinkedIn was provided, omit the `socials` block entirely.

## Team photo

Check if `OPENAI_API_KEY` exists in `.env`. If it does, ask:

> "Want me to generate a placeholder team photo?"

If yes, run:

```bash
pnpm generate-image "Professional headshot portrait of a friendly business person, neutral background, soft studio lighting, editorial style. No text, no logos." -o src/assets/team/<photo-name>.png --size 1024x1024
```

If the key is missing, tell the user:

> "To generate a team photo later, add an OPENAI_API_KEY to .env and run:
> `pnpm generate-image \"Professional headshot portrait...\" -o src/assets/team/<photo-name>.png --size 1024x1024`"

## Commit

IMPORTANT: Never commit a single-locale entry. Both DE and EN files must exist before committing.

Stage both files (and the photo if generated), then commit:

```bash
git add src/content/team/de/<slug>.md src/content/team/en/<slug>.md
git commit -m "feat: add team member — <name>"
```

Tell the user:

> "Team member added! Edit the placeholder bio in:
>
> - `src/content/team/de/<slug>.md`
> - `src/content/team/en/<slug>.md`
>
> Run `pnpm dev` to see them on the team page."
