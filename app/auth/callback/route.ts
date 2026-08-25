import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

/** Completes Supabase's PKCE email-confirmation flow and persists its session cookie. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/login?error=missing_confirmation_code', url.origin));

  const supabase = createAuthServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('Supabase email confirmation failed.', { message: error.message, status: error.status, code: error.code });
    return NextResponse.redirect(new URL('/login?error=confirmation_failed', url.origin));
  }

  return NextResponse.redirect(new URL('/onboarding', url.origin));
}
