import { z } from 'zod';

const NigerianPhone = z.string().trim().transform((input, context) => {
  const compact = input.replace(/[\s()-]/g, '');
  if (/^\+234[789]\d{9}$/.test(compact)) return compact;
  if (/^0[789]\d{9}$/.test(compact)) return `+234${compact.slice(1)}`;
  context.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a Nigerian number such as 08012345678 or +2348012345678.' });
  return z.NEVER;
});

export const phoneSchema = NigerianPhone;

export function normalizeNigerianPhone(input: string): string | null {
  const result = phoneSchema.safeParse(input);
  return result.success ? result.data : null;
}
