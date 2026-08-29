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
const SUPABASE_TIMEOUT_MS = 4_500;

async function withSupabaseTimeout<T>(operation: string, promise: PromiseLike<T>): Promise<T | undefined> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timeoutId = setTimeout(() => resolve(undefined), SUPABASE_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([Promise.resolve(promise), timeout]);
    if (result === undefined) console.error(`${operation} timed out after ${SUPABASE_TIMEOUT_MS}ms`);
    return result;
  } catch (error) {
    console.error(`${operation} failed:`, error);
    return undefined;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Authentication validation is missing Supabase server configuration.');
      return NextResponse.json({ error: 'Authentication is temporarily unavailable. Please try again.' }, { status: 503 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const existingUserResult = await withSupabaseTimeout('Signup duplicate-email check', adminClient
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle());

    if (!existingUserResult) {
      console.error('Duplicate email check failed open after timeout or transport failure.');
      return NextResponse.json({ ok: true });
    }

    if (existingUserResult.error) {
      console.error('Duplicate email check failed:', existingUserResult.error.message);
      return NextResponse.json({ error: 'We could not verify this email address. Please try again.' }, { status: 500 });
    }

    if (existingUserResult.data) {
      return NextResponse.json({ error: 'This email address is already registered to another account.' }, { status: 409 });
    }

    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    const countResult = await withSupabaseTimeout('Signup rate-limit check', adminClient
      .from('signup_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('attempted_at', windowStart));

    if (!countResult || countResult.error) {
      if (countResult?.error) console.error('Signup rate-limit check failed:', countResult.error.message);
      // Fail open on infra errors — don't block a real signup because
      // the rate-limit table had a hiccup. Log for visibility instead.
      return NextResponse.json({ ok: true });
    }

    if ((countResult.count ?? 0) >= MAX_SIGNUP_ATTEMPTS) {
      return NextResponse.json(
        {
          error: `Too many signup attempts for this email. Try again in ${WINDOW_MINUTES} minutes, or check your inbox for an existing confirmation link.`,
        },
        { status: 429 }
      );
    }

    const insertResult = await withSupabaseTimeout('Signup rate-limit insert', adminClient
      .from('signup_attempts')
      .insert({ email }));

    if (!insertResult || insertResult.error) {
      if (insertResult?.error) console.error('Failed to record signup attempt:', insertResult.error.message);
      return NextResponse.json({ ok: true });
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
