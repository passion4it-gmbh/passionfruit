import { getCollection, type CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";
import {
  PAGES,
  findPageByKey,
  type CollectionName,
  type PageKey,
} from "~/lib/page-registry";
import { getLocalizedPath, type Locale } from "~/i18n";

const LOCALES: Locale[] = ["de", "en"];

type UrlBlock = {
  deUrl: string;
  enUrl: string;
};

function buildUrl(site: URL, lang: Locale, slug: string): string {
  const base = site.href.replace(/\/$/, "");
  return `${base}${getLocalizedPath(slug, lang)}`;
}

function renderUrlBlock({ deUrl, enUrl }: UrlBlock, loc: string): string {
  return `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="de" href="${deUrl}" />
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${deUrl}" />
  </url>`;
}

function collectStaticBlocks(site: URL): string[] {
  const blocks: string[] = [];

  // Home pages
  const base = site.href.replace(/\/$/, "");
  const deHome = `${base}${getLocalizedPath("", "de")}`;
  const enHome = `${base}${getLocalizedPath("", "en")}`;
  const homePair: UrlBlock = { deUrl: deHome, enUrl: enHome };
  blocks.push(renderUrlBlock(homePair, deHome));
  blocks.push(renderUrlBlock(homePair, enHome));

  // Static pages from registry
  for (const page of PAGES) {
    if ("noindex" in page && page.noindex) continue;
    const deUrl = buildUrl(site, "de", page.slug.de);
    const enUrl = buildUrl(site, "en", page.slug.en);
    const urlPair: UrlBlock = { deUrl, enUrl };
    blocks.push(renderUrlBlock(urlPair, deUrl));
    blocks.push(renderUrlBlock(urlPair, enUrl));
  }

  return blocks;
}

type AnyEntry =
  | CollectionEntry<"blog">
  | CollectionEntry<"team">
  | CollectionEntry<"pages">
  | CollectionEntry<"careers">
  | CollectionEntry<"events">
  | CollectionEntry<"caseStudies">;

const COLLECTION_REGISTRY_KEY: Record<CollectionName, PageKey> = {
  blog: "blog-index",
  team: "team",
  pages: "about",
  careers: "careers-index",
  events: "events-index",
  caseStudies: "case-studies-index",
};

function collectCollectionBlocks(
  site: URL,
  collectionName: CollectionName,
  entries: AnyEntry[],
): string[] {
  const registryKey = COLLECTION_REGISTRY_KEY[collectionName];
  const pageEntry = findPageByKey(registryKey);

  // Group entries by translationKey
  const byKey = new Map<
    string,
    Partial<Record<Locale, { locale: Locale; slug: string }>>
  >();

  for (const entry of entries) {
    const slashIndex = entry.id.indexOf("/");
    if (slashIndex === -1) continue;

    const entryLocale = entry.id.slice(0, slashIndex) as Locale;
    const entrySlug = entry.id.slice(slashIndex + 1);

    if (!LOCALES.includes(entryLocale)) continue;

    const { translationKey } = entry.data as { translationKey: string };

    if (!byKey.has(translationKey)) {
      byKey.set(translationKey, {});
    }

    byKey.get(translationKey)![entryLocale] = {
      locale: entryLocale,
      slug: entrySlug,
    };
  }

  const blocks: string[] = [];

  for (const [, localeMap] of byKey) {
    const deEntry = localeMap["de"];
    const enEntry = localeMap["en"];

    if (!deEntry && !enEntry) continue;

    const deParent = pageEntry?.slug["de"] ?? registryKey;
    const enParent = pageEntry?.slug["en"] ?? registryKey;

    const deUrl = deEntry
      ? buildUrl(site, "de", `${deParent}/${deEntry.slug}`)
      : buildUrl(site, "de", deParent);
    const enUrl = enEntry
      ? buildUrl(site, "en", `${enParent}/${enEntry.slug}`)
      : buildUrl(site, "en", enParent);

    const pair: UrlBlock = { deUrl, enUrl };

    if (deEntry) blocks.push(renderUrlBlock(pair, deUrl));
    if (enEntry) blocks.push(renderUrlBlock(pair, enUrl));
  }

  return blocks;
}

export const GET: APIRoute = async ({ site }) => {
  // `site` is set in astro.config.mjs; this fallback only guards local/test
  // runs without it. Mirrors the config default rather than any brand domain.
  const siteUrl = site ?? new URL("https://example.com");

  const [blog, team, careers, events, caseStudies] = await Promise.all([
    getCollection("blog"),
    getCollection("team"),
    getCollection("careers"),
    getCollection("events"),
    getCollection("caseStudies"),
  ]);

  const urlBlocks: string[] = [
    ...collectStaticBlocks(siteUrl),
    ...collectCollectionBlocks(siteUrl, "blog", blog),
    ...collectCollectionBlocks(siteUrl, "team", team),
    ...collectCollectionBlocks(siteUrl, "careers", careers),
    ...collectCollectionBlocks(siteUrl, "events", events),
    ...collectCollectionBlocks(siteUrl, "caseStudies", caseStudies),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${urlBlocks.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
