import { z } from 'zod';

function cleanText(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

export const userProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).transform(cleanText),
  wardId: z.string().uuid().optional(),
  phone: z.string().max(20).optional(),
});

/** Profile edits deliberately accept only a phone number. Location and identity
 * are established during onboarding and must never be writable from this action. */
export const phoneProfileSchema = z.object({
  phone: z.string().trim().max(20).optional(),
});

export const onboardingProfileSchema = userProfileSchema.extend({
  lgaId: z.string().uuid(),
});

export const listingStatusSchema = z.enum(['active', 'sold', 'closed']);
export const vouchTypeSchema = z.enum(['community', 'tenure', 'transaction']);
export const listingSchema = z.object({
  type: z.enum(['sale', 'service', 'request']),
  title: z.string().min(1).max(120).transform(cleanText),
  price: z.string().max(50).optional(),
  description: z.string().max(500).optional().transform((v) => (v ? cleanText(v) : v)),
  photo_url: z.string().url().optional(),
});
