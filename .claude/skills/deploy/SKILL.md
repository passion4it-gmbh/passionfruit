---
name: deploy
description: Put the site online with Cloudflare Pages by connecting the GitHub repo. No API tokens needed. Covers the first deploy, custom domains and the contact form.
---

# Deploy to Cloudflare Pages

This skill puts the site online. Cloudflare connects to the GitHub repo and rebuilds the site on every merge to `main`. Pull requests get their own preview link.

## How to work with the user

The user is usually not technical. Tell them exactly where to click, one step at a time, and wait for them to confirm. Do everything else yourself.

**Never ask the user to paste passwords, API keys or tokens into this chat.** Anything secret goes straight into the Cloudflare dashboard.

## When to trigger

- User explicitly runs `/deploy`
- User asks about hosting, deployment, or "putting the site online"

## Prerequisites check

Before starting, verify:

1. The GitHub repo exists and has a remote (`git remote -v`). If not, help the user create one first, because Cloudflare deploys from GitHub: use `gh repo create`, or have them create an empty repo at https://github.com/new and add it as `origin` yourself.
2. The site builds (`pnpm build`).
3. No template placeholders are left:

   ```bash
   git grep --untracked -inE 'greenleaf|musterstra|musterstadt|hello@example\.com|\+49 123 456 789|DE123456789|platzhalter|is a placeholder|Brauche ich Programmierkenntnisse|Do I need programming skills|"98%"' -- src/content src/i18n src/data
   ```

   If this finds anything, stop and tell the user what's missing in plain language. A public German site with a placeholder imprint or privacy policy is a legal risk. Only continue if the user says this is a test site and confirms it.

## Step 1: Get the work onto `main`

Cloudflare publishes `main`. Commit any open changes on a branch, then get them merged:

- **`gh auth status` succeeds, in a local session:** open and merge a pull request with `gh pr create` and `gh pr merge --squash`.
- **Otherwise:** `git push -u origin HEAD`, then give the user this link to open and merge the pull request: `https://github.com/<owner>/<repo>/compare/main...<branch>?expand=1`. `gh pr` doesn't work in cloud sessions (`CLAUDE_CODE_REMOTE=true`).

## Step 2: Cloudflare account

Ask:

> "Do you have a Cloudflare account? The free plan is all you need."

If not:

> "Sign up at https://dash.cloudflare.com/sign-up, then come back when you're logged in."

## Step 3: Connect the repo

Guide the user:

> "Now let's connect your site. In the Cloudflare dashboard:
>
> 1. Open **Workers & Pages** in the left sidebar
> 2. Select **Create application**, then the **Pages** tab
> 3. Select **Connect to Git** (it may say **Import an existing Git repository**)
> 4. Sign in to GitHub if asked, and pick your website's repository
>
> Tell me when you see the build settings."

Then:

> "Enter these settings:
>
> - **Project name:** your company name in lowercase, like `my-company`. This becomes your address, `my-company.pages.dev`
> - **Production branch:** `main`
> - **Framework preset:** Astro
> - **Build command:** `pnpm build`
> - **Build output directory:** `dist`
>
> Leave everything else as it is, select **Save and Deploy**, and tell me the address it shows when it finishes. It usually takes a few minutes."

The build reads the Node version from `.nvmrc` and needs no environment variables.

Don't also set the `CLOUDFLARE_PROJECT_NAME` GitHub variable. That turns on the GitHub Actions deploy in `.github/workflows/deploy.yml`, and the site would deploy twice.

## Step 4: Check the live site

Once the user gives you the address:

1. Set `site` in `astro.config.mjs` to it, for example `site: "https://my-company.pages.dev"`. Canonical links, the sitemap and social previews use this.
2. Ship that change the same way as Step 1.
3. Ask the user to open the address and check the home page, the contact page and the imprint.

Tell them:

> "Your site is live! From now on, every change I make goes on its own branch. Cloudflare adds a preview link to the pull request, so you can check it before it goes live. Merging publishes it."

## Step 5: Custom domain (optional)

Ask:

> "Do you want to use your own web address?"

If yes:

> "In your Cloudflare project, open **Custom domains** and select **Set up a custom domain**. Enter your address, for example `www.example.com`, and follow the steps. If your domain is registered somewhere else, you'll need to change a DNS setting there, and Cloudflare will show you what to enter."

Afterwards, update `site` in `astro.config.mjs` to the new address and ship it the same way as Step 1.

**Warn the user about Cloudflare's own tracking features.** Web Analytics, Zaraz and the Google tag gateway add scripts to pages from outside the repo, so they bypass the site's cookie banner. Leave them off unless they're set up to respect consent.

## Step 6: Contact form (optional)

Ask:

> "Right now your contact form opens the visitor's email app, which needs no setup. Do you want messages delivered straight to your inbox instead? You'd need a free Brevo account, and it takes about 15 minutes."

If they're happy with email, skip to Step 7.

Otherwise, guide them through these one at a time:

> **1. Spam protection.** In the Cloudflare dashboard, open **Turnstile** and add a widget. Add your site's address, and also your `<project>.pages.dev` address so the form works on preview links. Keep that page open, because it shows a **site key** and a **secret key**.
>
> **2. Email delivery.** In https://app.brevo.com:
>
> - Open **Senders & IPs** and add the address your messages should come from. Brevo emails you a link to confirm it, and nothing is delivered until you click it.
> - Open **SMTP & API**, then **API Keys**, and create a key.
>
> **3. Settings.** In your Cloudflare project, open **Settings**, then **Variables and Secrets**. Add these for **Production** yourself. Please don't paste them here.

| Name                        | Type   | Value                                  |
| --------------------------- | ------ | -------------------------------------- |
| `PUBLIC_FORM_ENDPOINT`      | Text   | `/api/contact`                         |
| `PUBLIC_TURNSTILE_SITE_KEY` | Text   | The Turnstile site key                 |
| `TURNSTILE_SECRET_KEY`      | Secret | The Turnstile secret key               |
| `BREVO_API_KEY`             | Secret | The Brevo API key                      |
| `CONTACT_SENDER`            | Secret | The sender address confirmed in Brevo  |
| `CONTACT_RECIPIENT`         | Secret | The inbox that should receive messages |

> **4. Publish.** Open **Deployments**, find the latest production deployment, and select **Retry deployment**. Then send yourself a test message through the form.

The `PUBLIC_*` values are built into the site, so they only take effect after that new deployment. To make the form work on preview links too, repeat the settings for **Preview**.

## Step 7: Protect `main` (optional, for teams)

For a team, suggest requiring pull requests. In a local session with `gh`:

```bash
gh repo edit --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge
```

Then in GitHub, under **Settings → Branches**, add a rule for `main` that requires a pull request and passing checks.

## Troubleshooting

**The build fails in Cloudflare:** ask the user to copy the last lines of the build log into this chat. Fix the cause and ship it. Check first that the build command is `pnpm build`, not `npm run build`, and that the output directory is `dist`.

**The site shows old content:** check the deployment finished in **Deployments**, then wait a minute and reload.

**No preview link on a pull request:** Cloudflare only builds pull requests from branches in the same repo. Check the project's **Settings → Builds** too.

**The user can't find a button:** Cloudflare's dashboard changes. Ask what they see on screen and adapt, rather than repeating the steps.
