---
name: new-team-member
description: Add a new bilingual team member with proper frontmatter and both DE/EN files.
---

# Add a New Team Member

Create a bilingual (DE + EN) team member entry with correct frontmatter, a real bio, and a commit.

## Gather info

Ask these ONE AT A TIME using the AskUserQuestion tool:

1. "What's their name?"
2. "What's their role/title?" (will be translated for both locales)
3. "What are their specializations? (e.g., Frontend, TypeScript, UI/UX, Strategy)" (will be translated for both locales)
4. "LinkedIn URL? (optional — press enter to skip)"
5. "What should their short bio say? A few facts are enough, and I'll write it up."
6. "Do you have a photo of them? (optional)"

This is a real person, so use only what the user told you. Don't invent their background, and never commit placeholder text, because it would go live.

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

<German bio>
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

<English bio>
```

If no LinkedIn was provided, omit the `socials` block entirely.

**Only include `photo` if the file exists.** A path to a missing file fails the whole build. `TeamCard` works without one.

## Team photo

Use a real photo only. Never generate a portrait of a real person.

- **Local session:** ask for the file path and copy it to `src/assets/team/<photo-name>.png`.
- **Cloud session (`CLAUDE_CODE_REMOTE=true`):** ask the user to upload it to `src/assets/team/` on GitHub (**Add file → Upload files**), then pull it.

If they don't have one yet, leave `photo` out. They can add it later.

## Commit

IMPORTANT: Never commit a single-locale entry. Both DE and EN files must exist before committing.

Stage both files (and the photo if generated), then commit:

```bash
git add src/content/team/de/<slug>.md src/content/team/en/<slug>.md src/assets/team/<photo-name>.png  # photo only if provided
git commit -m "feat: add team member — <name>"
```

In a cloud session, also push: `git push -u origin HEAD`.

Tell the user the team member is saved in both languages. In a local session, start `pnpm dev` yourself and give them the link. In a cloud session, tell them it appears on the preview link once the pull request is open, or on the site once it's merged.
