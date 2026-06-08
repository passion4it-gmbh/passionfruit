---
name: deploy
description: Set up deployment to Cloudflare Pages. Guides through account creation, API tokens, GitHub secrets, and verifies the first deploy.
---

# Deploy to Cloudflare Pages

This skill sets up automatic deployment to Cloudflare Pages. Every push to `main` triggers a build and deploy.

## When to trigger

- User explicitly runs `/deploy`
- User asks about hosting, deployment, or "putting the site online"

## Prerequisites check

Before starting, verify:

1. The GitHub repo exists and has a remote (`git remote -v`)
2. The site builds locally (`pnpm build`)
3. The deploy workflow exists at `.github/workflows/deploy.yml`

If the workflow file is missing, create it from the template (see bottom of this file).

## Step 1: Cloudflare account

Ask:

> "Do you have a Cloudflare account? (The free plan is all you need)"

- **Yes** — proceed to Step 2
- **No** — tell them:
  > "Sign up at https://dash.cloudflare.com/sign-up — it's free. Come back when you're logged in."

Wait for confirmation before proceeding.

## Step 2: Create the Cloudflare Pages project

Guide the user:

> "Let's create your Cloudflare Pages project. Go to https://dash.cloudflare.com/ and:
>
> 1. Click **Workers & Pages** in the left sidebar
> 2. Click **Create** → **Pages** → **Direct Upload** (we deploy via GitHub Actions, not Git integration)
> 3. Name your project (e.g., your company name in lowercase, like `my-company`)
> 4. Upload any file to create the project (it will be overwritten on first deploy)
>
> Tell me the project name you chose."

Save the project name — it's needed for the GitHub variable.

## Step 3: Create API token

Guide the user:

> "Now let's create an API token for GitHub to deploy with:
>
> 1. Go to https://dash.cloudflare.com/profile/api-tokens
> 2. Click **Create Token**
> 3. Use the **Cloudflare Pages — Edit** template (or create custom with `Account.Cloudflare Pages: Edit` permission)
> 4. Under Account Resources, select your account
> 5. Click **Continue to summary** → **Create Token**
> 6. **Copy the token now** — you won't see it again!
>
> Also grab your **Account ID** from the Cloudflare dashboard sidebar (it's in the URL: `dash.cloudflare.com/<account-id>/...` or shown on the Workers & Pages overview page on the right side)."

Wait for both the API token and Account ID.

## Step 4: Add secrets to GitHub

Guide the user:

> "Now add these to your GitHub repository:
>
> 1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
> 2. Add these **secrets** (click **New repository secret**):
>    - Name: `CLOUDFLARE_API_TOKEN` — Value: (paste your API token)
>    - Name: `CLOUDFLARE_ACCOUNT_ID` — Value: (paste your account ID)
> 3. Switch to the **Variables** tab and add:
>    - Name: `CLOUDFLARE_PROJECT_NAME` — Value: `<the project name from Step 2>`
>
> Tell me when that's done."

Alternatively, if the user has `gh` CLI:

```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh variable set CLOUDFLARE_PROJECT_NAME --body "<project-name>"
```

## Step 5: Update the site URL

Once the user provides their Cloudflare Pages URL (or custom domain), update `astro.config.mjs`:

```javascript
site: "https://<project-name>.pages.dev",
```

If they have a custom domain, use that instead. This URL is used for canonical links, sitemap, and OG tags.

## Step 6: Configure repo settings for the PR workflow

passionfruit uses a PR-based workflow: open a PR → Cloudflare deploys a preview → review the preview → squash merge → production deploy. Configure the repo to enforce this.

If the user has `gh` CLI, run these automatically:

```bash
gh repo edit \
  --enable-squash-merge \
  --enable-merge-commit=false \
  --enable-rebase-merge=false \
  --enable-auto-merge \
  --delete-branch-on-merge \
  --squash-merge-commit-title=PR_TITLE \
  --squash-merge-commit-message=PR_BODY
```

Otherwise, guide them:

> "Go to **Settings → General → Pull Requests** and:
>
> - ✅ Allow squash merging (default to 'Pull request title and description')
> - ❌ Allow merge commits
> - ❌ Allow rebase merging
> - ✅ Automatically delete head branches
>
> Then **Settings → Branches → Add branch protection rule** for `main`:
>
> - ✅ Require a pull request before merging
> - ✅ Require status checks to pass (the CI workflow)
> - ✅ Require linear history"

## Step 7: Trigger first deploy

```bash
git add -A
git commit -m "feat: configure Cloudflare Pages deployment"
git push
```

Then check the deployment:

> "Your site is deploying! You can watch the progress at:
>
> - **GitHub Actions**: https://github.com/<org>/<repo>/actions
> - **Cloudflare Dashboard**: https://dash.cloudflare.com/ → Workers & Pages → your project
>
> Once it's done (usually 1-2 minutes), your site will be live at:
> `https://<project-name>.pages.dev`
>
> **From now on:** never push directly to `main`. Create a branch, open a PR, and Cloudflare will deploy a preview URL (commented on the PR automatically). Squash-merge to ship to production."

## Step 8: Custom domain (optional)

If the user wants to use their own domain:

> "Want to use your own domain? In the Cloudflare Pages dashboard:
>
> 1. Go to your project → **Custom domains**
> 2. Click **Set up a custom domain**
> 3. Enter your domain (e.g., `www.example.com`)
> 4. Cloudflare will guide you through DNS setup
>
> If your domain is already on Cloudflare, it's automatic. Otherwise, you'll need to update your DNS records."

After adding a custom domain, update `astro.config.mjs` with the custom domain URL.

## Step 9: Wire the contact form (optional)

Ask:

> "Do you want a working contact form that delivers emails, or is the default mailto link fine for now?"

- **mailto is fine** — stop here. The form works out of the box with a `mailto:` fallback; nothing to configure.
- **Working email delivery** — proceed.

### 9a. Create a Turnstile widget

Using the API token and Account ID already collected in Steps 3–4, call the Cloudflare API to create a Turnstile widget for the site's domain. Replace `<account_id>`, `<token>`, and `<site-domain>` with the values you have:

```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/<account_id>/challenges/widgets" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"<project> contact","domains":["<site-domain>"],"mode":"managed"}'
```

From the response `result`, capture:

- `sitekey` → used as `PUBLIC_TURNSTILE_SITE_KEY`
- `secret` → used as `TURNSTILE_SECRET_KEY`

**If the call returns 403:** The token needs two additional scopes — **Turnstile › Edit** and **Account Settings › Read**. Either edit the existing token at `https://dash.cloudflare.com/profile/api-tokens` to add those scopes, or create the widget manually in the Cloudflare dashboard under **Turnstile** and copy the sitekey and secret from there.

### 9b. Collect provider details from the user

Ask:

> "To send contact-form emails, I need three things:
>
> 1. **Brevo API key** — from https://app.brevo.com → My account → SMTP & API → API Keys
> 2. **Sender address** — a verified sender or domain in Brevo. **Important:** Brevo requires you to verify a sender address (or domain) before transactional emails will go through. You can verify one at https://app.brevo.com → Senders & IPs → Senders. This is the address that will appear in the From field.
> 3. **Recipient inbox** — the email address where contact-form submissions should land.
>
> This is the one step I can't automate — Brevo's sender verification requires a human to click a confirmation link."

Wait for all three values before proceeding.

### 9c. Set the Pages project env vars

Patch the Cloudflare Pages project with all six variables. Replace placeholders with real values:

```bash
curl -s -X PATCH "https://api.cloudflare.com/client/v4/accounts/<account_id>/pages/projects/<project_name>" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "deployment_configs": {
      "production": {
        "env_vars": {
          "PUBLIC_FORM_ENDPOINT":       { "type": "plain_text",   "value": "/api/contact" },
          "PUBLIC_TURNSTILE_SITE_KEY":  { "type": "plain_text",   "value": "<sitekey>" },
          "BREVO_API_KEY":              { "type": "secret_text",  "value": "<brevo-api-key>" },
          "TURNSTILE_SECRET_KEY":       { "type": "secret_text",  "value": "<widget-secret>" },
          "CONTACT_RECIPIENT":          { "type": "secret_text",  "value": "<recipient-inbox>" },
          "CONTACT_SENDER":             { "type": "secret_text",  "value": "<verified-sender>" }
        }
      }
    }
  }'
```

Mirror the same block into `preview` if the user wants contact-form submissions to work on preview deployments too (replace `"production"` with `"preview"` and repeat the patch).

**Important:** `PUBLIC_FORM_ENDPOINT` and `PUBLIC_TURNSTILE_SITE_KEY` are **build-time** variables — Astro inlines them at build. The other four are read at request time by the Pages Function and can be updated without a rebuild. A new deploy is required to pick up the two `PUBLIC_*` values.

### 9d. Trigger a redeploy

Trigger a fresh build so Astro inlines the new `PUBLIC_*` values:

```bash
git commit --allow-empty -m "chore: trigger redeploy for contact-form env vars"
git push
```

Alternatively, the user can go to **Cloudflare Pages → your project → Deployments → Retry deployment** on the latest production deployment.

Once the build completes, the contact form will validate Turnstile tokens server-side and deliver submissions via Brevo.

> **Note:** The passionfruit showcase at `passionfruit.passion4it.de` has `CONTACT_RECIPIENT` pointed at a passion4it inbox so the form is live. Full design rationale and implementation details are in `docs/superpowers/specs/2026-06-08-contact-form-delivery-design.md`.

## Troubleshooting

**Deploy fails with "Project not found":**

- Check `CLOUDFLARE_PROJECT_NAME` variable matches the project name in Cloudflare exactly

**Deploy fails with "Authentication error":**

- Check `CLOUDFLARE_API_TOKEN` secret is set correctly
- Verify the token has Cloudflare Pages Edit permission
- Check `CLOUDFLARE_ACCOUNT_ID` is correct

**Build succeeds but site shows old content:**

- Cloudflare Pages caches aggressively. Wait 1-2 minutes or purge cache in Cloudflare dashboard.

**Deploy doesn't run on PR / no preview URL:**

- Deploy triggers on PRs against `main` AND pushes to `main`
- Check that `CLOUDFLARE_PROJECT_NAME` variable is set (job is gated on it)
- Check the workflow file exists at `.github/workflows/deploy.yml`
- You can also manually trigger from Actions → Deploy → Run workflow

**Preview URL not commented on PR:**

- The deploy job needs `pull-requests: write` permission (already set in template)
- Check the "Comment preview URL on PR" step in the workflow logs

```

```
