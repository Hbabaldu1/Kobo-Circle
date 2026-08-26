'use server';

import { revalidatePath } from 'next/cache';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { listingSchema } from '@/lib/validation';

export type ListingActionState = { error?: string; listingId?: string };

export async function createListing(
  _: ListingActionState,
  formData: FormData
): Promise<ListingActionState> {
  const parsed = listingSchema.safeParse({
    type: formData.get('type'),
    title: formData.get('title'),
    price:
      formData.get('type') === 'request'
        ? undefined
        : (formData.get('price') as string) || undefined,
    description: (formData.get('description') as string) || undefined,
    photo_url: (formData.get('photo_url') as string) || undefined,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? 'Check your listing details and try again.' };
  }

  try {
    const supabase = createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: 'Please sign in before posting a listing.' };

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('estate_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Could not load profile before posting.', profileError.message);
      return { error: 'We could not verify your account. Please try again.' };
    }

    if (!profile) return { error: 'Finish onboarding before posting a listing.' };

    const { data, error } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        estate_id: profile.estate_id,
        ...parsed.data,
      })
      .select('id')
      .single();

    if (error) {
      if (error.message.includes('Rate limit exceeded: max 5 listings per 24 hours')) {
        return { error: "You've hit today's posting limit — try again tomorrow" };
      }
      console.error('Could not create listing.', { code: error.code, message: error.message });
      return { error: 'We could not post your listing. Please try again.' };
    }

    revalidatePath('/feed');
    return { listingId: data.id };
  } catch (err) {
    console.error('Unexpected error in createListing:', err);
    return { error: 'Something went wrong. Please try again.' };
  }
}
