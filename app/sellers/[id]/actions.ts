'use server';

import { revalidatePath } from 'next/cache';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export type VouchActionState = { error?: string; vouched?: true };
export async function createVouch(_: VouchActionState, formData: FormData): Promise<VouchActionState> {
  const sellerId = formData.get('sellerId');
  if (typeof sellerId !== 'string') return { error: 'That neighbour is unavailable.' };
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Please sign in before vouching.' };
  if (user.id === sellerId) return { error: 'You cannot vouch for yourself.' };
  const { error } = await supabase.from('vouches').insert({ voucher_id: user.id, vouched_for_id: sellerId });
  if (error) {
    if (error.code === '23505' || error.message.includes('one_vouch_per_pair')) return { error: "You've already vouched for this neighbour" };
    if (error.message.includes('Rate limit exceeded: max 1 vouch per week')) return { error: 'You can give one vouch per week — try again soon' };
    if (error.message.includes('Vouch not allowed: account has no prior listing or vouch history')) return { error: 'Post a listing or give your first vouch before you can vouch for others' };
    if (error.message.includes('no_self_vouch')) return { error: 'You cannot vouch for yourself.' };
    console.error('Could not create vouch.', { code: error.code, message: error.message });
    return { error: 'We could not save your vouch. Please try again.' };
  }
  revalidatePath(`/sellers/${sellerId}`);
  revalidatePath('/feed');
  return { vouched: true };
}
