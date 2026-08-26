import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Check your email and password.' },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Authentication validation is missing Supabase server configuration.');
      return NextResponse.json({ error: 'Authentication is temporarily unavailable. Please try again.' }, { status: 503 });
    }

    // Service-role access is created only while handling a request, so a build
    // does not require runtime-only Supabase credentials.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    const { count, error: countError } = await adminClient
      .from('login_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('attempted_at', windowStart);

    if (countError) {
      console.error('Rate-limit check failed:', countError.message);
      // Fail open on infra errors — don't block real logins because the
      // rate-limit table had a hiccup. Log it for visibility instead.
      return NextResponse.json({ ok: true });
    }

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.` },
        { status: 429 }
      );
    }

    // Record this attempt regardless of outcome — the actual
    // signInWithPassword call happens client-side after this returns ok.
    const { error: insertError } = await adminClient
      .from('login_attempts')
      .insert({ email });

    if (insertError) {
      console.error('Failed to record login attempt:', insertError.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Unexpected error in validate-login:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
