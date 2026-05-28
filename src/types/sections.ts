import type { ImageMetadata } from "astro";

export interface SectionProps {
  eyebrow?: string;
  headline: string;
  lede?: string;
  tone?: "surface" | "elevated" | "dark" | "accent-wash";
  padding?: "sm" | "md" | "lg";
  align?: "start" | "center";
}

export interface AsymmetricHeroProps extends SectionProps {
  image: ImageMetadata;
  imageAlt: string;
  imagePosition?: "right" | "left" | "fullbleed";
  cta?: { label: string; href: string };
}

export interface MagazineGridCell {
  size: "small" | "medium" | "large";
  headline: string;
  lede?: string;
  image?: ImageMetadata;
  imageAlt?: string;
  href?: string;
}

export interface MagazineGridProps extends SectionProps {
  cells: MagazineGridCell[];
}

export interface StickyStoryChapter {
  headline: string;
  body: string;
  image: ImageMetadata;
  imageAlt: string;
}

export interface StickyStoryProps extends SectionProps {
  chapters: StickyStoryChapter[];
}

export interface EditorialQuoteAttribution {
  name: string;
  role?: string;
  avatar?: ImageMetadata;
  avatarAlt?: string;
}

export interface EditorialQuoteProps extends Omit<SectionProps, "headline"> {
  /**
   * Override: EditorialQuote uses the `quote` as the focal text and does not
   * render a separate headline, so the inherited `SectionProps.headline`
   * required-ness is loosened here. `Omit` is required because TS does not
   * permit widening a required field to optional via a sub-interface alone.
   */
  headline?: string;
  quote: string;
  attribution: EditorialQuoteAttribution;
}

export interface SplitFeatureItem {
  headline: string;
  body: string;
  image: ImageMetadata;
  imageAlt: string;
  cta?: { label: string; href: string };
}

export interface SplitFeatureProps extends SectionProps {
  features: SplitFeatureItem[];
}

export interface TrustLogo {
  src: ImageMetadata;
  alt: string;
  href?: string;
}

export interface TrustProps extends SectionProps {
  logos: TrustLogo[];
}

export interface ComparisonColumn {
  name: string;
  highlight?: boolean;
}

export interface ComparisonRow {
  feature: string;
  values: (boolean | string)[];
}

export interface ComparisonProps extends SectionProps {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  /** Drives screen-reader labels for the Check/X icons. */
  lang?: "de" | "en";
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQProps extends SectionProps {
  items: FAQItem[];
}
