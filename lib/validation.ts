// lib/validation.ts
import { z } from 'zod';

// Strips control characters and collapses whitespace. This is NOT HTML
// sanitization — it's not needed, because all user text in this app is
// rendered via React's default escaping (JSX text content), never via
// dangerouslySetInnerHTML. If that ever changes, DOMPurify-equivalent
// sanitization would need to be reintroduced at the render boundary,
// not the write boundary.
function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '') // strip control chars
    .trim();
}

export const userProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).transform(cleanText),
  streetId: z.string().uuid(),
  phone: z.string().max(20).optional(),
});

export const listingStatusSchema = z.enum(['active', 'sold', 'closed']);

export const listingSchema = z.object({
  type: z.enum(['sale', 'service', 'request']),
  title: z.string().min(1).max(120).transform(cleanText),
  price: z.string().max(50).optional(),
  description: z.string().max(500).optional().transform((v) => (v ? cleanText(v) : v)),
  photo_url: z.string().url().optional(),
});
