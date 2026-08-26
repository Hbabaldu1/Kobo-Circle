import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { userProfileSchema } from '@/lib/validation';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const parsed = userProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Check your name and choose a street.' },
      { status: 400 }
    );
  }

  try {
    const supabase = createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email_confirmed_at || !user.email) {
      return NextResponse.json(
        { error: 'Confirm your email and sign in again.' },
        { status: 401 }
      );
    }

    const { data: street, error: streetError } = await supabase
      .from('streets')
      .select('id, estate_id')
      .eq('id', parsed.data.streetId)
      .maybeSingle();

    if (streetError) {
      console.error('Street lookup failed:', streetError.message);
      return NextResponse.json(
        { error: 'We could not verify that street. Please try again.' },
        { status: 500 }
      );
    }

    if (!street) {
      return NextResponse.json(
        { error: 'That street is unavailable. Please choose another one.' },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      name: parsed.data.name,
      email: user.email,
      phone: parsed.data.phone,
      street_id: street.id,
      estate_id: street.estate_id,
    });

    if (insertError) {
      // Postgres unique violation on the primary key means this user
      // already completed onboarding — treat it as success, not failure,
      // so a double-submit (double-click, back-button retry) doesn't
      // strand the user on an error screen.
      if (insertError.code === '23505') {
        return NextResponse.json({ ok: true });
      }
      console.error('Onboarding insert failed:', insertError.message);
      return NextResponse.json(
        { error: 'We could not save your estate details. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Unexpected error in onboarding:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
