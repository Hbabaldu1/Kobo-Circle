// import { NextResponse } from 'next/server';
// import { createAuthServerClient } from '@/lib/supabase/auth-server';
// import { onboardingProfileSchema } from '@/lib/validation';

// export async function POST(request: Request) {
//   let body: unknown;
//   try {
//     body = await request.json();
//   } catch {
//     return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
//   }

//   const parsed = onboardingProfileSchema.safeParse(body);
//   if (!parsed.success) {
//     return NextResponse.json(
//       { error: 'Check your name and choose a Local Government.' },
//       { status: 400 }
//     );
//   }

//   try {
//     const supabase = createAuthServerClient();
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (!user || !user.email_confirmed_at || !user.email) {
//       return NextResponse.json(
//         { error: 'Confirm your email and sign in again.' },
//         { status: 401 }
//       );
//     }

//     const { data: existingEmailUser, error: existingEmailError } = await supabase
//       .from('users')
//       .select('id')
//       .eq('email', user.email)
//       .neq('id', user.id)
//       .maybeSingle();

//     if (existingEmailError) {
//       console.error('Duplicate email check failed:', existingEmailError.message);
//       return NextResponse.json({ error: 'We could not verify this email address. Please try again.' }, { status: 500 });
//     }

//     if (existingEmailUser) {
//       return NextResponse.json({ error: 'This email address is already registered to another account.' }, { status: 409 });
//     }

//     const { data: lga, error: lgaError } = await supabase.from('lgas').select('state_id').eq('id', parsed.data.lgaId).maybeSingle();
//     if (lgaError || !lga) {
//       console.error('LGA lookup failed:', lgaError?.message);
//       return NextResponse.json({ error: 'We could not verify that Local Government. Please try again.' }, { status: 400 });
//     }

//     if (parsed.data.wardId) {
//       const { data: ward, error: wardError } = await supabase
//         .from('wards')
//         .select('id')
//         .eq('id', parsed.data.wardId)
//         .eq('lga_id', parsed.data.lgaId)
//         .maybeSingle();

//       if (wardError) {
//         console.error('Ward lookup failed:', wardError.message);
//         return NextResponse.json({ error: 'We could not verify that ward. Please try again.' }, { status: 500 });
//       }
//       if (!ward) return NextResponse.json({ error: 'That ward is unavailable for this Local Government.' }, { status: 400 });
//     }

//     const { error: insertError } = await supabase.from('users').insert({
//       id: user.id,
//       name: parsed.data.name,
//       email: user.email,
//       phone: parsed.data.phone,
//       ward_id: parsed.data.wardId ?? null,
//       lga_id: parsed.data.lgaId,
//       state_id: lga.state_id,
//     });

//     if (insertError) {
//       if (insertError.code === '23505') {
//         const { data: existingProfile, error: existingProfileError } = await supabase
//           .from('users')
//           .select('id')
//           .eq('id', user.id)
//           .maybeSingle();

//         if (!existingProfileError && existingProfile) {
//           return NextResponse.json({ ok: true });
//         }

//         return NextResponse.json({ error: 'This email address is already registered to another account.' }, { status: 409 });
//       }
//       console.error('Onboarding insert failed:', insertError.message);
//       return NextResponse.json(
//         { error: 'We could not save your location details. Please try again.' },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json({ ok: true });
//   } catch (err) {
//     console.error('Unexpected error in onboarding:', err);
//     return NextResponse.json(
//       { error: 'Something went wrong. Please try again.' },
//       { status: 500 }
//     );
//   }
// }







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

  // Validate payload against schema (expects lgaId, wardId, name, phone)
  const parsed = onboardingProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid onboarding details. Please check your inputs and select a valid LGA.' },
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

    // Check if the email is already registered to a different user ID
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

    // Verify local government area (LGA) and retrieve associated state_id
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

    // Verify ward if provided
    if (parsed.data.wardId) {
      const { data: ward, error: wardError } = await supabase
        .from('wards')
        .select('id')
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
    }

    // Insert user with new location hierarchy (State, LGA, Ward)
    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      name: parsed.data.name,
      email: user.email,
      phone: parsed.data.phone,
      ward_id: parsed.data.wardId ?? null,
      lga_id: parsed.data.lgaId,
      state_id: lga.state_id,
    } as any);

    if (insertError) {
      // Primary key constraint collision fallback
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

      console.error('Onboarding database insert failed:', insertError.message);
      return NextResponse.json(
        { error: 'We could not save your location details. Please try again.' },
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
