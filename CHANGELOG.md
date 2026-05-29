# Changelog

## [1.0.0](https://github.com/passion4it-gmbh/passionfruit/compare/v0.6.0...v1.0.0) (2026-05-29)


### ⚠ BREAKING CHANGES

* **og:** public/og-default.png is removed. Downstream forks that customized that file with their own image — or have external references (LinkedIn cache, archive.org, etc.) pointing at the old URL — need to migrate. Run pnpm generate-og once after pulling; both new locale-specific files land in public/. If your i18n site.name / site.tagline and public/favicon.svg are your own, the generated images are on-brand without prompting. For an art-directed alternative, use the new /brand skill Step 2 (Branded template / AI generated / Skip) or run pnpm generate-image targeting public/og-default-{de,en}.png directly.

### Features

* **analytics:** add Google Tag Manager component ([#18](https://github.com/passion4it-gmbh/passionfruit/issues/18)) ([453d2e2](https://github.com/passion4it-gmbh/passionfruit/commit/453d2e26dd6b61eb4a0fe290424e4c963b42c0b6))
* **careers:** add careers collection, CareerCard, CareerPost, and bilingual fixtures ([#24](https://github.com/passion4it-gmbh/passionfruit/issues/24)) ([570f591](https://github.com/passion4it-gmbh/passionfruit/commit/570f591745cdd91e47543af9ebbf65bbd7d6ceb8))
* **case-studies:** case studies collection trilogy + bilingual fixtures ([#23](https://github.com/passion4it-gmbh/passionfruit/issues/23)) ([aa8c54e](https://github.com/passion4it-gmbh/passionfruit/commit/aa8c54ea1296dc8c47fd9b80404ce8645d956bcb))
* **claude:** add create-passionfruit-site bootstrap skill ([#26](https://github.com/passion4it-gmbh/passionfruit/issues/26)) ([07a8c8a](https://github.com/passion4it-gmbh/passionfruit/commit/07a8c8a656cfef3c456dd4df0c3bc9f9292ebb26))
* **claude:** package skills as plugin, swap superpowers for code-review ([#22](https://github.com/passion4it-gmbh/passionfruit/issues/22)) ([0818046](https://github.com/passion4it-gmbh/passionfruit/commit/0818046523c9f43e0b82b1a7e583a1eca7929958))
* **components:** add generic CollectionFilter foundation ([#21](https://github.com/passion4it-gmbh/passionfruit/issues/21)) ([f3fd3d5](https://github.com/passion4it-gmbh/passionfruit/commit/f3fd3d5b0b0686df79b91fc0da021f00cd3a1907))
* **components:** add TrustSection and ComparisonTable ([#19](https://github.com/passion4it-gmbh/passionfruit/issues/19)) ([d82b340](https://github.com/passion4it-gmbh/passionfruit/commit/d82b340857482f4d1d111e5c940b5ba03873d6b8))
* **components:** per-component sidecar docs + auto-generated catalog ([#31](https://github.com/passion4it-gmbh/passionfruit/issues/31)) ([aa2447f](https://github.com/passion4it-gmbh/passionfruit/commit/aa2447f101b82c578a36a14edcaad5f1588261a5))
* **design-floor:** editorial type, section archetypes, motion, state design (Spec 1) ([#29](https://github.com/passion4it-gmbh/passionfruit/issues/29)) ([27b29d6](https://github.com/passion4it-gmbh/passionfruit/commit/27b29d6d1abb49b578458da7b72ce628280627a2))
* **docs+skills:** Spec 2 — Claude-grade docs (STYLE_GUIDE rewrite + 3 skills) ([#32](https://github.com/passion4it-gmbh/passionfruit/issues/32)) ([c87203c](https://github.com/passion4it-gmbh/passionfruit/commit/c87203c72ea903b30f5f0952e2cd8f95fc448844))
* **events:** events content collection trilogy ([#25](https://github.com/passion4it-gmbh/passionfruit/issues/25)) ([ee412b9](https://github.com/passion4it-gmbh/passionfruit/commit/ee412b9f32aec56e2761735a3a7f9b6d2252fc9f))
* **media:** add YouTube and Spotify facades ([#16](https://github.com/passion4it-gmbh/passionfruit/issues/16)) ([f0f4a41](https://github.com/passion4it-gmbh/passionfruit/commit/f0f4a411dfbc609b63d8980c65df3fce59d857d2))
* **og:** auto-discover optional background photo at src/assets/og/bg.png ([#30](https://github.com/passion4it-gmbh/passionfruit/issues/30)) ([173a69b](https://github.com/passion4it-gmbh/passionfruit/commit/173a69bd98812169c97fe3f673143e7356aa2ebf))
* **og:** branded bilingual sharing-image generator ([#27](https://github.com/passion4it-gmbh/passionfruit/issues/27)) ([9b4b248](https://github.com/passion4it-gmbh/passionfruit/commit/9b4b24864cec14575cb31d47d17f3dc74e9a984b))


### Bug Fixes

* **structured-data:** add [@context](https://github.com/context) and [@type](https://github.com/type) to BlogPosting JSON-LD ([#28](https://github.com/passion4it-gmbh/passionfruit/issues/28)) ([0a52b95](https://github.com/passion4it-gmbh/passionfruit/commit/0a52b956b3b1eae81b9b1191d843fda767a00aff))

## [0.6.0](https://github.com/passion4it-gmbh/passionfruit/compare/v0.5.0...v0.6.0) (2026-05-28)


### Features

* **pages:** render heroImage on about, services, contact ([#14](https://github.com/passion4it-gmbh/passionfruit/issues/14)) ([366f670](https://github.com/passion4it-gmbh/passionfruit/commit/366f6701b4a073866dde6ded6538a893bb7492fe))

## [0.5.0](https://github.com/passion4it-gmbh/passionfruit/compare/v0.4.0...v0.5.0) (2026-05-28)


### Features

* **security:** add HTML cache header + opt-in CSP violation reporting ([#11](https://github.com/passion4it-gmbh/passionfruit/issues/11)) ([bfe0e24](https://github.com/passion4it-gmbh/passionfruit/commit/bfe0e243765829675d4966a78b9bdbec92795c32))

## [0.4.0](https://github.com/passion4it-gmbh/passionfruit/compare/v0.3.0...v0.4.0) (2026-05-28)


### Features

* **security:** add Cloudflare _headers with HSTS + CSP ([#8](https://github.com/passion4it-gmbh/passionfruit/issues/8)) ([f61884e](https://github.com/passion4it-gmbh/passionfruit/commit/f61884ec45a7972720ac2d178d2823b1031f9fc1))

## [0.3.0](https://github.com/passion4it-gmbh/passionfruit/compare/v0.2.0...v0.3.0) (2026-05-28)


### Features

* **analytics:** fix PostHog host + add GA4 (gtag) component ([#2](https://github.com/passion4it-gmbh/passionfruit/issues/2)) ([4ccec68](https://github.com/passion4it-gmbh/passionfruit/commit/4ccec68128dffa6362fdd7616bd33b7f32f2c715))

## [0.2.0](https://github.com/passion4it-gmbh/passionfruit/compare/v0.1.0...v0.2.0) (2026-05-28)


### Features

* add Cloudflare Pages deployment with /deploy skill ([d3b652e](https://github.com/passion4it-gmbh/passionfruit/commit/d3b652efe6f377fb500de7c839429e087f593ad9))
* add commitlint, commit hooks, spell checker, link checker, legal pages ([aa50db2](https://github.com/passion4it-gmbh/passionfruit/commit/aa50db28850c7160c1b1472644c1ae3580b6ce7e))
* add release-please + template-cleanup workflow ([1d36c73](https://github.com/passion4it-gmbh/passionfruit/commit/1d36c734cab1222aedf8d687ced543c2d8a363be))
* all pages — home, about, services, blog, team, contact, 404, sitemap ([2b5d5a4](https://github.com/passion4it-gmbh/passionfruit/commit/2b5d5a4e77ebc4d4f02b29093d20d5cb31ad72cb))
* BaseLayout, Header, Footer, Button, Badge, LanguageSwitcher ([7df09ee](https://github.com/passion4it-gmbh/passionfruit/commit/7df09ee68fc596533824499ced8821743c3f0d47))
* bilingual check script with test suite ([9ecef5f](https://github.com/passion4it-gmbh/passionfruit/commit/9ecef5fa4bebc8b472f3a3d2e0a3b81d33de6c41))
* Claude Code setup — CLAUDE.md, STYLE_GUIDE.md, CONTRIBUTING.md, onboard skill, plugins ([8c62cec](https://github.com/passion4it-gmbh/passionfruit/commit/8c62cece62653da99968f7e7aadc4e49c2a26590))
* complete visual redesign — scroll animations, glass effects, fluid typography ([d02c10d](https://github.com/passion4it-gmbh/passionfruit/commit/d02c10d74af096745bf7af94c3131d3c4a716dd5))
* contact form, content skills, prerequisites check, brand assets ([57f21f1](https://github.com/passion4it-gmbh/passionfruit/commit/57f21f18c6cf5a5c0daf48fd9ab3b2f542bbe44f))
* content collections — blog, team, pages with example bilingual content ([cede46b](https://github.com/passion4it-gmbh/passionfruit/commit/cede46b9f2182cb1c1a4d160bace0049aded6a8e))
* content components — BlogCard, BlogPost, TeamCard, PageContent, FAQs, StructuredData ([30b49b9](https://github.com/passion4it-gmbh/passionfruit/commit/30b49b9ea83b15b290e2b45bcee0f7e619f963be))
* cookie consent + PostHog analytics (consent-gated, env-var-driven) ([f5ac948](https://github.com/passion4it-gmbh/passionfruit/commit/f5ac94851b6f2b1d5f1f3007dc43bb789198b76c))
* **deploy:** preview deploys on PRs + document PR workflow ([5270ef5](https://github.com/passion4it-gmbh/passionfruit/commit/5270ef5dc1c06d649335eb1e00bbccb362724be5))
* ESLint configs (TS + a11y) and CI pipeline ([00fe33f](https://github.com/passion4it-gmbh/passionfruit/commit/00fe33f24edd0ec46512f33ab8e8b2cfec22c3c7))
* GPT Image generation + visual upgrade ([a3bd20a](https://github.com/passion4it-gmbh/passionfruit/commit/a3bd20a3d5d73dd0f8597e543ffaf9037d90681a))
* i18n system — useTranslations hook, de/en translation files ([b0c63ee](https://github.com/passion4it-gmbh/passionfruit/commit/b0c63eeaacfcfa73af8a63867da5faf8a7824256))
* lib utilities — page registry, structured data, date formatting ([3ed0175](https://github.com/passion4it-gmbh/passionfruit/commit/3ed01753bd71ea503fdb5e91f73aa75930df940a))
* polish pass — header glass, TeamCard photos, STYLE_GUIDE.md ([3354641](https://github.com/passion4it-gmbh/passionfruit/commit/33546414a41bfd3546b33edeb3aea815fea7beed))
* redesign all inner pages as proper designed sections ([0d729bc](https://github.com/passion4it-gmbh/passionfruit/commit/0d729bc9647c4de271e6bc63f78754a1e9b9739a))
* refine BlogPost, BlogCard, and 404 page ([73cdcaf](https://github.com/passion4it-gmbh/passionfruit/commit/73cdcaf3a3922c3ac381b65af3da7eedfd08a7d7))
* styling foundation — Tailwind v4 tokens, Inter font, blog prose ([398c4da](https://github.com/passion4it-gmbh/passionfruit/commit/398c4da9b5a4fbc03979343667f77250db7ac543))
* upgrade all inner pages + team headshots ([16cefbe](https://github.com/passion4it-gmbh/passionfruit/commit/16cefbea18ce33e02e6960933e75de0dc5b97407))


### Bug Fixes

* **deploy:** skip deploy job when Cloudflare not configured ([b0a05f0](https://github.com/passion4it-gmbh/passionfruit/commit/b0a05f0f64dae3443dd1369c9d908690e1a798b2))
* exclude content.config.ts from ESLint type-checked rules (astro:content virtual types) ([07afe3f](https://github.com/passion4it-gmbh/passionfruit/commit/07afe3f29bffd5740091bee4f96bb8781a8a5708))
* hero extends behind transparent header — no light strip ([cdf94eb](https://github.com/passion4it-gmbh/passionfruit/commit/cdf94eb58752973394a4ed7b1e732488c9fa9950))
* link 'passionfruit' in footer to GitHub repo ([6c13a85](https://github.com/passion4it-gmbh/passionfruit/commit/6c13a85ca104fc5b74564c7061909508932d1654))
* rename content config to src/content.config.ts (Astro v6 convention) ([92cb7c9](https://github.com/passion4it-gmbh/passionfruit/commit/92cb7c97d311d8e6f27008dd192116feeb16d0a9))
* run astro sync before lint/typecheck in build + CI (generates astro:content types) ([1be990a](https://github.com/passion4it-gmbh/passionfruit/commit/1be990af29d82a06a023f559b7d4155f7fb17ba6))
* transparent header on dark pages, gains bg on scroll ([aa73077](https://github.com/passion4it-gmbh/passionfruit/commit/aa73077cd889ca8a76d1614e62e5bf3f54d17853))

## Changelog

All notable changes to the **passionfruit** template are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

<!-- release-please-managed -->
