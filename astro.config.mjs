import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// Open external links in a new tab with safe rel attributes. Mirrors the
// defaults of the rehype-external-links plugin (http(s) and protocol-relative
// URLs only — mailto:, tel:, and in-site links are left untouched), ported to
// a Sätteri hast visitor now that Sätteri is Astro's Markdown engine.
const externalLinks = {
  name: "external-links",
  element: {
    filter: ["a"],
    visit(node, ctx) {
      const href = node.properties?.href;
      if (
        typeof href === "string" &&
        (/^https?:\/\//i.test(href) || href.startsWith("//"))
      ) {
        ctx.setProperty(node, "target", "_blank");
        ctx.setProperty(node, "rel", ["noopener", "noreferrer"]);
      }
    },
  },
};

export default defineConfig({
  site: "https://example.com",
  output: "static",
  compressHTML: true,
  trailingSlash: "always",
  markdown: {
    processor: satteri({ hastPlugins: [externalLinks] }),
  },
  i18n: {
    locales: ["de", "en"],
    defaultLocale: "de",
    routing: {
      prefixDefaultLocale: false,
    },
    fallback: {
      en: "de",
    },
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
