import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { onboardingProfileSchema } from '@/lib/validation';

export async function GET() {
  return NextResponse.json(
    { message: 'Onboarding API active. Submit via POST.' },
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

  const parsed = onboardingProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid onboarding details. Please select a valid Local Government.',
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

    const { data: existingEmailUser, error: existingEmailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .neq('id', user.id)
      .maybeSingle();

    if (existingEmailError) {
      console.error('Email check failed:', existingEmailError.message);
      return NextResponse.json(
        { error: 'Could not verify email. Try again.' },
        { status: 500 }
      );
    }

    if (existingEmailUser) {
      return NextResponse.json(
        { error: 'This email is already registered.' },
        { status: 409 }
      );
    }

    // The client submits only an LGA ID. Its state is always resolved here.
    const { data: lga, error: lgaError } = await supabase
      .from('lgas')
      .select('state_id')
      .eq('id', parsed.data.lgaId)
      .maybeSingle();

    if (lgaError || !lga) {
      console.error('LGA lookup failed:', lgaError?.message);
      return NextResponse.json(
        { error: 'Selected Local Government does not exist.' },
        { status: 400 }
      );
    }

    let location = {
      state_id: lga.state_id,
      lga_id: parsed.data.lgaId,
      ward_id: null as string | null,
    };

    if (parsed.data.wardId) {
      const { data: ward, error: wardError } = await supabase
        .from('wards')
        .select('id, lga_id, state_id')
        .eq('id', parsed.data.wardId)
        .maybeSingle();

      if (wardError) {
        console.error('Ward lookup failed:', wardError.message);
        return NextResponse.json(
          { error: 'Could not verify ward.' },
          { status: 500 }
        );
      }
      if (!ward || ward.state_id !== lga.state_id || ward.lga_id !== parsed.data.lgaId) {
        return NextResponse.json(
          { error: 'Selected ward is invalid for this Local Government.' },
          { status: 400 }
        );
      }

      // A ward is the authoritative source for its LGA; never compose this
      // pair from independent client values.
      location = { state_id: ward.state_id, lga_id: ward.lga_id, ward_id: ward.id };
    }

    const insertData: Record<string, unknown> = {
      id: user.id,
      name: parsed.data.name,
      email: user.email,
      phone: parsed.data.phone,
      ...location,
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert(insertData as any);

    if (insertError) {
      if (insertError.code === '23503') {
        return NextResponse.json(
          { error: "That location combination isn't valid — please reselect your Ward." },
          { status: 400 }
        );
      }

      if (insertError.code === '23505') {
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (existingProfile) {
          return NextResponse.json({ ok: true });
        }

        return NextResponse.json(
          { error: 'This account has already completed onboarding.' },
          { status: 409 }
        );
      }

      console.error('Onboarding insert failed:', insertError.message);
      return NextResponse.json(
        { error: insertError.message || 'We could not save your details.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Unexpected onboarding error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Try again.' },
      { status: 500 }
    );
  }
}
