import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

const plainText = (maximum: number) =>
  z.string().trim().min(1).max(maximum).transform((value) => DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }));

export const listingSchema = z.object({
  type: z.enum(['sale', 'service', 'request']),
  title: plainText(120),
  price: z.string().trim().max(80).nullable().optional(),
  description: plainText(500),
});

export const vouchSchema = z.object({
  vouchedForId: z.string().uuid(),
  note: plainText(200),
});

export const userProfileSchema = z.object({
  name: plainText(120),
  phone: z.string().trim().min(7).max(20).regex(/^\+?[0-9][0-9\s()-]*$/, 'Enter a valid phone number.'),
  streetId: z.string().uuid(),
  estateId: z.string().uuid(),
});

export type ListingInput = z.infer<typeof listingSchema>;
export type VouchInput = z.infer<typeof vouchSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;

/** Apply this at every rendering boundary in addition to input validation. */
export function sanitizeUserText(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
