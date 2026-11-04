import type { Locale } from "~/i18n";
import type { FeatureListItem } from "~/types/sections";

const services: Record<Locale, FeatureListItem[]> = {
  de: [
    {
      title: "Webdesign",
      body: "Moderne, responsive Websites, die begeistern.",
      bullets: [
        "Responsive Design",
        "Markengerechte Gestaltung",
        "UI/UX Optimierung",
        "Barrierefreiheit (WCAG AA)",
      ],
    },
    {
      title: "Webentwicklung",
      body: "Technisch einwandfreie Lösungen mit modernsten Technologien.",
      bullets: [
        "Astro & TypeScript",
        "Blitzschnelle Ladezeiten",
        "SEO-optimiert",
        "Mehrsprachig",
      ],
    },
    {
      title: "Beratung",
      body: "Strategische Beratung für Ihre digitale Transformation.",
      bullets: [
        "Digitale Strategie",
        "Technologie-Beratung",
        "Workshop-Formate",
        "KI-Integration",
      ],
    },
  ],
  en: [
    {
      title: "Web Design",
      body: "Modern, responsive websites that delight.",
      bullets: [
        "Responsive design",
        "Brand-aligned styling",
        "UI/UX optimization",
        "Accessibility (WCAG AA)",
      ],
    },
    {
      title: "Web Development",
      body: "Technically excellent solutions with cutting-edge technologies.",
      bullets: [
        "Astro & TypeScript",
        "Lightning-fast load times",
        "SEO optimized",
        "Multilingual",
      ],
    },
    {
      title: "Consulting",
      body: "Strategic consulting for your digital transformation.",
      bullets: [
        "Digital strategy",
        "Technology consulting",
        "Workshop formats",
        "AI integration",
      ],
    },
  ],
};

export function getServices(locale: Locale): FeatureListItem[] {
  return services[locale];
}
