import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .regex(/\d/, 'Include at least one number.'),
});

const MAX_SIGNUP_ATTEMPTS = 3;
const WINDOW_MINUTES = 60;

// Initialize Supabase admin client with service role key (or fallback to your admin helper import if available)
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Check your email and password.' },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  try {
    const { data: existingUser, error: existingUserError } = await adminClient
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUserError) {
      console.error('Duplicate email check failed:', existingUserError.message);
      return NextResponse.json({ error: 'We could not verify this email address. Please try again.' }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ error: 'This email address is already registered to another account.' }, { status: 409 });
    }

    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    const { count, error: countError } = await adminClient
      .from('signup_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('attempted_at', windowStart);

    if (countError) {
      console.error('Signup rate-limit check failed:', countError.message);
      // Fail open on infra errors — don't block a real signup because
      // the rate-limit table had a hiccup. Log for visibility instead.
      return NextResponse.json({ ok: true });
    }

    if ((count ?? 0) >= MAX_SIGNUP_ATTEMPTS) {
      return NextResponse.json(
        {
          error: `Too many signup attempts for this email. Try again in ${WINDOW_MINUTES} minutes, or check your inbox for an existing confirmation link.`,
        },
        { status: 429 }
      );
    }

    const { error: insertError } = await adminClient
      .from('signup_attempts')
      .insert({ email });

    if (insertError) {
      console.error('Failed to record signup attempt:', insertError.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Unexpected error in validate-signup:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
