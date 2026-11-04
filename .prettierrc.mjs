/** @type {import("prettier").Config} */
export default {
  plugins: ["prettier-plugin-astro"],
  // Must mirror compressHTML in astro.config.mjs: the plugin formats by the
  // whitespace rules the compiler applies, and defaults to Astro's "jsx" mode.
  astroCompressHTML: true,
  overrides: [{ files: "*.astro", options: { parser: "astro" } }],
};
