import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { onboardingProfileSchema } from '@/lib/validation';

// Handle GET requests gracefully to prevent 405 Method Not Allowed errors
export async function GET() {
  return NextResponse.json(
    { message: 'Onboarding API is active. Use POST to submit user onboarding details.' },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed JSON payload.' }, { status: 400 });
  }

  // 1. Log payload for debugging bad request errors in server logs
  console.log('Onboarding Payload received:', body);

  // 2. Validate payload against Zod schema (expects lgaId, wardId, name, phone)
  const parsed = onboardingProfileSchema.safeParse(body);
  if (!parsed.success) {
    console.error('Validation Error Details:', parsed.error.format());
    return NextResponse.json(
      {
        error: 'Invalid onboarding details. Please check your inputs and select a valid Local Government.',
        details: parsed.error.format(),
      },
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
        { error: 'Please confirm your email address and sign in again.' },
        { status: 401 }
      );
    }

    // 3. Check if email is already registered under another account
    const { data: existingEmailUser, error: existingEmailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .neq('id', user.id)
      .maybeSingle();

    if (existingEmailError) {
      console.error('Email uniqueness check failed:', existingEmailError.message);
      return NextResponse.json(
        { error: 'Could not verify email uniqueness. Please try again.' },
        { status: 500 }
      );
    }

    if (existingEmailUser) {
      return NextResponse.json(
        { error: 'This email address is already registered to another account.' },
        { status: 409 }
      );
    }

    // 4. Verify Local Government Area (LGA) and retrieve associated state_id and legacy_estate_id
    const { data: lga, error: lgaError } = await supabase
      .from('lgas')
      .select('state_id, legacy_estate_id')
      .eq('id', parsed.data.lgaId)
      .maybeSingle();

    if (lgaError || !lga) {
      console.error('LGA lookup failed:', lgaError?.message);
      return NextResponse.json(
        { error: 'Selected Local Government does not exist.' },
        { status: 400 }
      );
    }

    let legacyStreetId: string | null = null;

    // 5. Verify Ward if provided
    if (parsed.data.wardId) {
      const { data: ward, error: wardError } = await supabase
        .from('wards')
        .select('id, legacy_street_id')
        .eq('id', parsed.data.wardId)
        .eq('lga_id', parsed.data.lgaId)
        .maybeSingle();

      if (wardError) {
        console.error('Ward lookup failed:', wardError.message);
        return NextResponse.json(
          { error: 'Could not verify ward. Please try again.' },
          { status: 500 }
        );
      }
      if (!ward) {
        return NextResponse.json(
          { error: 'The selected ward is invalid for this Local Government.' },
          { status: 400 }
        );
      }
      legacyStreetId = ward.legacy_street_id ?? null;
    }

    // 6. Insert user record into database
    // Includes estate_id and street_id mapping to prevent NOT NULL database constraint errors
    const insertPayload: Record<string, unknown> = {
      id: user.id,
      name: parsed.data.name,
      email: user.email,
      phone: parsed.data.phone,
      ward_id: parsed.data.wardId ?? null,
      lga_id: parsed.data.lgaId,
      state_id: lga.state_id,
      estate_id: lga.legacy_estate_id ?? null,
      street_id: legacyStreetId,
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert(insertPayload as any);

    if (insertError) {
      // Primary key constraint collision handling (user already inserted)
      if (insertError.code === '23505') {
        const { data: existingProfile, error: existingProfileError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!existingProfileError && existingProfile) {
          return NextResponse.json({ ok: true });
        }

        return NextResponse.json(
          { error: 'This account has already completed onboarding.' },
          { status: 409 }
        );
      }

      console.error('Onboarding insert failed:', insertError.message);
      return NextResponse.json(
        { error: insertError.message || 'We could not save your location details. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Unexpected onboarding error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
