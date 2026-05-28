/**
 * Reusable JSON-LD payloads for site-wide structured data.
 * Consumed by StructuredData.astro.
 */

import type { CollectionEntry } from "astro:content";
import type { Locale } from "~/i18n";

export type { Locale };

const SITE_URL = "https://example.com";
const LOGO_URL = `${SITE_URL}/logos/greenleaf-digital.svg`;

export const ORGANIZATION_LD = {
  "@id": `${SITE_URL}/#organization`,
  name: "Greenleaf Digital",
  url: SITE_URL,
  logo: LOGO_URL,
} as const;

export const WEBSITE_LD = {
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Greenleaf Digital",
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: ["de-DE", "en-US"],
} as const;

export const PUBLISHER_REF = {
  "@type": "Organization",
  name: "Greenleaf Digital",
  logo: {
    "@type": "ImageObject",
    url: LOGO_URL,
  },
} as const;

export interface BlogAuthor {
  name: string;
  role?: string;
}

/** Maps the template's employmentType enum to Schema.org-valid values. */
const SCHEMA_EMPLOYMENT_TYPE: Record<string, string> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contractor: "CONTRACTOR",
  internship: "INTERN",
};

export function buildJobPostingLd(
  entry: CollectionEntry<"careers">,
  canonicalUrl: string,
): Record<string, unknown> {
  const d = entry.data;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: d.title,
    description: d.summary,
    datePosted: d.postedAt.toISOString().split("T")[0],
    employmentType:
      SCHEMA_EMPLOYMENT_TYPE[d.employmentType] ?? d.employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: "Greenleaf Digital",
      sameAs: SITE_URL,
      logo: LOGO_URL,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: d.location,
        addressCountry: d.country,
      },
    },
    url: canonicalUrl,
    potentialAction: {
      "@type": "ApplyAction",
      target: d.applyUrl,
    },
  };

  if (d.remote) {
    ld["jobLocationType"] = "TELECOMMUTE";
    ld["applicantLocationRequirements"] = {
      "@type": "Country",
      name: d.country,
    };
  }

  if (d.closesAt) {
    ld["validThrough"] = d.closesAt.toISOString().split("T")[0];
  }

  if (d.salaryMin !== undefined || d.salaryMax !== undefined) {
    ld["baseSalary"] = {
      "@type": "MonetaryAmount",
      currency: d.salaryCurrency,
      value: {
        "@type": "QuantitativeValue",
        ...(d.salaryMin !== undefined ? { minValue: d.salaryMin } : {}),
        ...(d.salaryMax !== undefined ? { maxValue: d.salaryMax } : {}),
        unitText: "YEAR",
      },
    };
  }

  return ld;
}

export function buildEventLd(
  entry: CollectionEntry<"events">,
  canonicalUrl: string,
  lang: Locale,
): Record<string, unknown> {
  const loc = entry.data.location;

  const locationLd: Record<string, unknown> =
    loc.kind === "online"
      ? { "@type": "VirtualLocation", url: loc.url ?? canonicalUrl }
      : {
          "@type": "Place",
          name: loc.venue ?? loc.city ?? "TBD",
          address: loc.city
            ? { "@type": "PostalAddress", addressLocality: loc.city }
            : undefined,
        };

  return {
    "@context": "https://schema.org/",
    "@type": "Event",
    name: entry.data.title,
    description: entry.data.summary,
    startDate: entry.data.startsAt.toISOString(),
    ...(entry.data.endsAt ? { endDate: entry.data.endsAt.toISOString() } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode:
      loc.kind === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : loc.kind === "hybrid"
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
    location: locationLd,
    ...(entry.data.registrationUrl
      ? { offers: { "@type": "Offer", url: entry.data.registrationUrl } }
      : {}),
    organizer: PUBLISHER_REF,
    url: canonicalUrl,
    inLanguage: lang === "de" ? "de-DE" : "en-US",
  };
}

export function buildReviewLd(
  entry: CollectionEntry<"caseStudies">,
  canonicalUrl: string,
  lang: Locale,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org/",
    "@type": "Review",
    author: {
      "@type": "Person",
      name: entry.data.personName,
      jobTitle: entry.data.personRole,
      worksFor: {
        "@type": "Organization",
        name: entry.data.clientName,
      },
    },
    reviewBody: entry.data.quote,
    reviewRating: {
      "@type": "Rating",
      ratingValue: 5,
      bestRating: 5,
    },
    itemReviewed: {
      "@type": "Organization",
      name: ORGANIZATION_LD.name,
      url: ORGANIZATION_LD.url,
    },
    ...(entry.data.publishedAt
      ? { datePublished: entry.data.publishedAt.toISOString() }
      : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    inLanguage: lang === "de" ? "de-DE" : "en-US",
  };
}

export function buildBlogPostingLd(
  entry: CollectionEntry<"blog">,
  author: BlogAuthor | undefined,
  imageUrl: string,
  canonicalUrl: string,
  lang: Locale,
): Record<string, unknown> {
  return {
    headline: entry.data.title,
    description: entry.data.description,
    image: imageUrl,
    datePublished: entry.data.publishedAt.toISOString(),
    author: {
      "@type": "Person",
      name: author?.name ?? "Greenleaf Digital",
      ...(author?.role ? { jobTitle: author.role } : {}),
    },
    publisher: PUBLISHER_REF,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    inLanguage: lang === "de" ? "de-DE" : "en-US",
  };
}
