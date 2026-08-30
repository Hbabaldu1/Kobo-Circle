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
      // Use the user's already-validated location tuple as-is. Rebuilding it
      // from form data or separate location lookups could violate composite FKs.
      .select('state_id, lga_id, ward_id')
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
        state_id: profile.state_id,
        lga_id: profile.lga_id,
        ward_id: profile.ward_id,
        ...parsed.data,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23503') {
        return { error: "That location combination isn't valid — please reselect your Ward." };
      }
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
