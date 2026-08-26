'use server';

import { revalidatePath } from 'next/cache';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { userProfileSchema } from '@/lib/validation';

export type ProfileActionState = { error?: string; saved?: true };

export async function updateProfile(_: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const parsed = userProfileSchema.safeParse({
    name: formData.get('name'),
    streetId: formData.get('streetId'),
    phone: (formData.get('phone') as string) || undefined,
  });

  if (!parsed.success) {
    return { error: 'Enter your name, choose your street, and check your optional phone number.' };
  }

  try {
    const supabase = createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Please sign in before updating your profile.' };

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('estate_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Could not load profile before update.', profileError.message);
      return { error: 'We could not verify your profile. Please try again.' };
    }

    if (!profile) return { error: 'Finish onboarding before editing your profile.' };

    const { data: street, error: streetError } = await supabase
      .from('streets')
      .select('estate_id')
      .eq('id', parsed.data.streetId)
      .maybeSingle();

    if (streetError) {
      console.error('Could not verify selected street.', streetError.message);
      return { error: 'We could not verify that street. Please try again.' };
    }

    if (!street || street.estate_id !== profile.estate_id) {
      return { error: 'Choose a street from your current estate.' };
    }

    const { error } = await supabase
      .from('users')
      .update({
        name: parsed.data.name,
        phone: parsed.data.phone,
        street_id: parsed.data.streetId,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Could not update profile.', { code: error.code, message: error.message });
      return { error: 'We could not save your profile. Please try again.' };
    }

    revalidatePath('/profile');
    revalidatePath('/feed');
    return { saved: true };
  } catch (err) {
    console.error('Unexpected error in updateProfile:', err);
    return { error: 'Something went wrong. Please try again.' };
  }
}
