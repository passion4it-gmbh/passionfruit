import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      translationKey: z.string(),
      title: z.string(),
      description: z.string(),
      publishedAt: z.coerce.date(),
      author: z.string(),
      heroImage: image().optional(),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
    }),
});

const team = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/team" }),
  schema: ({ image }) =>
    z.object({
      translationKey: z.string(),
      name: z.string(),
      role: z.string(),
      photo: image().optional(),
      displayOrder: z.number().default(0),
      specializations: z.array(z.string()).default([]),
      socials: z
        .object({
          linkedin: z.string().url().optional(),
          github: z.string().url().optional(),
          website: z.string().url().optional(),
        })
        .default({}),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: ({ image }) =>
    z.object({
      translationKey: z.string(),
      title: z.string(),
      description: z.string(),
      heroImage: image().optional(),
    }),
});

// ---------------------------------------------------------------------------
// careers
//
// Plain markdown-based job postings. No external HR-platform dependency —
// downstream users add .md files directly under src/content/careers/{de,en}/.
// The markdown body is the long-form job description.
// ---------------------------------------------------------------------------
const careers = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/careers" }),
  schema: z.object({
    /** Bilingual pairing key — must match across DE and EN variants. */
    translationKey: z.string().min(1),
    title: z.string(),
    location: z.string(),
    department: z.string().optional(),
    employmentType: z.enum([
      "full-time",
      "part-time",
      "contractor",
      "internship",
    ]),
    applyUrl: z.string().url(),
    summary: z.string(),
    postedAt: z.coerce.date(),
    closesAt: z.coerce.date().optional(),
    seniority: z.string().optional(),
    /** ISO 3166-1 alpha-2 country code — required for Schema.org JobPosting validation. */
    country: z.string().default("DE"),
    /** True for fully remote or remote-friendly roles. Adds jobLocationType: "TELECOMMUTE". */
    remote: z.boolean().default(false),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional(),
    salaryCurrency: z.string().default("EUR"),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog, team, pages, careers };
