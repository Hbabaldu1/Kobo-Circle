import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

const plainText = (maximum: number) =>
  z.string().trim().min(1).max(maximum).transform((value) => DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }));

export const listingSchema = z.object({
  type: z.enum(['sale', 'service', 'request']),
  title: plainText(120),
  price: z.string().trim().max(80).nullable().optional().transform((value) => value || null),
  description: z.string().trim().max(500).transform((value) => DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) || null),
});

export const vouchSchema = z.object({
  vouchedForId: z.string().uuid(),
  note: plainText(200),
});

export const userProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).transform((value) => DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })),
  phone: z.string().trim().max(20).regex(/^$|^\+?[0-9][0-9\s()-]*$/, 'Enter a valid phone number.').transform((value) => value || null),
  streetId: z.string().uuid(),
});

export const signupSchema = z.object({ email: z.string().trim().email(), password: z.string().min(8).regex(/\d/) });
export const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) });

export type ListingInput = z.infer<typeof listingSchema>;
export type VouchInput = z.infer<typeof vouchSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;

/** Apply this at every rendering boundary in addition to input validation. */
export function sanitizeUserText(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
