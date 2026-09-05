import 'server-only';

import { Resend } from 'resend';

export type SendEmailInput = {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

/**
 * Sends a transactional email through Resend when a verified sending domain is
 * available. This module is deliberately not imported by the authentication
 * flow: Supabase's built-in email provider remains responsible for signup and
 * confirmation emails until Supabase SMTP is explicitly configured.
 *
 * Domain activation checklist (do not use `@kobo-circle.vercel.app`):
 * 1. Add the purchased domain in the Resend dashboard.
 * 2. Add Resend's SPF, DKIM, and DMARC DNS records at the domain registrar.
 * 3. Wait for Resend verification (usually minutes to a few hours).
 * 4. Only then set Supabase Dashboard > Authentication > Email Templates >
 *    SMTP Settings to Resend's SMTP relay, using a from-address on that
 *    verified domain.
 */
export async function sendEmailWithResend(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required to send email with Resend.');
  }

  const resend = new Resend(apiKey);
  return resend.emails.send(input);
}
