import { defineCollection, z } from 'astro:content';

const TOOLS = [
  'merge', 'split', 'rotate', 'reorder', 'delete', 'extract',
  'compress', 'jpg-to-pdf', 'pdf-to-jpg', 'ocr', 'unlock',
] as const;

const landing = defineCollection({
  type: 'content',
  schema: z.object({
    h1: z.string(),
    metaTitle: z.string().max(70),
    metaDescription: z.string().min(100).max(160),
    tool: z.enum(TOOLS),
    presetParam: z.string().optional(),
    intentTag: z.enum(['operation', 'size', 'india-govt', 'quality', 'alternative', 'combination']).optional(),
    relatedSlugs: z.array(z.string()).default([]),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).min(3),
    publishedAt: z.string().optional(),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    targetSlug: z.string(),
    author: z.string().default('PDF Toolkit'),
  }),
});

export const collections = { landing, blog };
