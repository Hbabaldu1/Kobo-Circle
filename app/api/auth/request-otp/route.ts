import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkOtpRateLimit } from '@/lib/otp-rate-limit';
import { normalizeNigerianPhone } from '@/lib/phone';
import type { Database } from '@/types/database';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const phone = typeof (body as { phone?: unknown } | null)?.phone === 'string'
    ? normalizeNigerianPhone((body as { phone: string }).phone)
    : null;
  if (!phone) return NextResponse.json({ error: 'Enter a valid Nigerian phone number.' }, { status: 400 });

  try {
    const rate = await checkOtpRateLimit(phone);
    if (!rate.allowed) {
      const minutes = Math.ceil(rate.retryAfterSeconds / 60);
      return NextResponse.json({ error: `Too many codes were requested. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` }, { status: 429 });
    }
  } catch {
    return NextResponse.json({ error: 'We cannot send a code right now. Please try again shortly.' }, { status: 503 });
  }

  const cookieStore = cookies();
  const response = NextResponse.json({ phone });
  const supabase = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return NextResponse.json({ error: 'We could not send a code. Please check your number and try again.' }, { status: 400 });
  return response;
}
