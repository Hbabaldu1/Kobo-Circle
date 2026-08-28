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

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const parsed = onboardingProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Check your name and choose a Local Government.' },
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

    const { data: existingEmailUser, error: existingEmailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .neq('id', user.id)
      .maybeSingle();

    if (existingEmailError) {
      console.error('Duplicate email check failed:', existingEmailError.message);
      return NextResponse.json(
        { error: 'We could not verify this email address. Please try again.' },
        { status: 500 }
      );
    }

    if (existingEmailUser) {
      return NextResponse.json(
        { error: 'This email address is already registered to another account.' },
        { status: 409 }
      );
    }

    // Fetch LGA along with legacy_estate_id mapping
    const { data: lga, error: lgaError } = await supabase
      .from('lgas')
      .select('state_id, legacy_estate_id')
      .eq('id', parsed.data.lgaId)
      .maybeSingle();

    if (lgaError || !lga) {
      console.error('LGA lookup failed:', lgaError?.message);
      return NextResponse.json(
        { error: 'We could not verify that Local Government. Please try again.' },
        { status: 400 }
      );
    }

    let legacyStreetId: string | null = null;

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
          { error: 'We could not verify that ward. Please try again.' },
          { status: 500 }
        );
      }
      if (!ward) {
        return NextResponse.json(
          { error: 'That ward is unavailable for this Local Government.' },
          { status: 400 }
        );
      }
      legacyStreetId = ward.legacy_street_id;
    }

    // Insert user including legacy references to prevent NOT NULL constraint failures
    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      name: parsed.data.name,
      email: user.email,
      phone: parsed.data.phone,
      ward_id: parsed.data.wardId ?? null,
      lga_id: parsed.data.lgaId,
      state_id: lga.state_id,
      estate_id: lga.legacy_estate_id,
      street_id: legacyStreetId,
    });

    if (insertError) {
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
          { error: 'This email address is already registered to another account.' },
          { status: 409 }
        );
      }
      console.error('Onboarding insert failed:', insertError.message);
      return NextResponse.json(
        { error: 'We could not save your location details. Please try again.' },
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
