'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { listingSchema, listingStatusSchema } from '@/lib/validation';

export type EditListingState = { error?: string; saved?: true };
export type ListingStatusActionState = { error?: string; updated?: true };
export type DeleteListingState = { error?: string };

export async function deleteListing(_: DeleteListingState, formData: FormData): Promise<DeleteListingState> {
  const listingId = formData.get('listingId');
  const redirectTo = formData.get('redirectTo');

  if (typeof listingId !== 'string') return { error: 'That listing is unavailable.' };

  try {
    const supabase = createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Please sign in before deleting a listing.' };

    const { data, error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Could not delete listing.', { code: error.code, message: error.message });
      return { error: 'We could not delete your listing. Please try again.' };
    }

    if (!data) return { error: 'You can only delete your own listings.' };

    revalidatePath('/feed');
    revalidatePath('/profile');
  } catch (err) {
    console.error('Unexpected error in deleteListing:', err);
    return { error: 'Something went wrong. Please try again.' };
  }

  if (redirectTo === 'feed') redirect('/feed');
  return {};
}

export async function updateListing(_: EditListingState, formData: FormData): Promise<EditListingState> {
  const listingId = formData.get('listingId');
  const parsed = listingSchema.safeParse({
    type: formData.get('type'),
    title: formData.get('title'),
    price:
      formData.get('type') === 'request'
        ? undefined
        : (formData.get('price') as string) || undefined,
    description: (formData.get('description') as string) || undefined,
  });
  const status = listingStatusSchema.safeParse(formData.get('status'));

  if (typeof listingId !== 'string') return { error: 'That listing is unavailable.' };
  if (!parsed.success || !status.success) return { error: 'Check your listing details and try again.' };

  try {
    const supabase = createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Please sign in before editing a listing.' };

    const { data, error } = await supabase
      .from('listings')
      .update({
        title: parsed.data.title,
        price: parsed.data.price,
        description: parsed.data.description,
        status: status.data,
      })
      .eq('id', listingId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Could not update listing.', { code: error.code, message: error.message });
      return { error: 'We could not save your listing. Please try again.' };
    }

    if (!data) return { error: 'You can only edit your own listings.' };


    revalidatePath(`/listings/${listingId}`);
    revalidatePath('/feed');
    return { saved: true };
  } catch (err) {
    console.error('Unexpected error in updateListing:', err);
    return { error: 'Something went wrong. Please try again.' };
  }
}

export async function updateListingStatus(_: ListingStatusActionState, formData: FormData): Promise<ListingStatusActionState> {
  const listingId = formData.get('listingId');
  const status = listingStatusSchema.safeParse(formData.get('status'));

  if (typeof listingId !== 'string') return { error: 'That listing is unavailable.' };
  if (!status.success || status.data === 'active') return { error: 'Choose a valid listing status.' };

  try {
    const supabase = createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Please sign in before updating a listing.' };

    const { data, error } = await supabase
      .from('listings')
      .update({ status: status.data })
      .eq('id', listingId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Could not update listing status.', { code: error.code, message: error.message });
      return { error: 'We could not update your listing. Please try again.' };
    }

    if (!data) return { error: 'You can only update your own listings.' };

    revalidatePath(`/listings/${listingId}`);
    revalidatePath('/feed');
    return { updated: true };
  } catch (err) {
    console.error('Unexpected error in updateListingStatus:', err);
    return { error: 'Something went wrong. Please try again.' };
  }
}
