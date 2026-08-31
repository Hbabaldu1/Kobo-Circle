'use server';

import { revalidatePath } from 'next/cache';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { phoneProfileSchema } from '@/lib/validation';

export type ProfileActionState = { error?: string; saved?: true };

export async function updateNotificationPreferences(preferences: { vouch_enabled: boolean; message_enabled: boolean; listing_enabled: boolean }) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Please sign in before changing notification preferences.' };
  const { error } = await supabase.from('notification_preferences').upsert({ user_id: user.id, ...preferences, updated_at: new Date().toISOString() });
  if (error) { console.error('Could not save notification preferences:', error.message); return { error: 'We could not save notification preferences.' }; }
  revalidatePath('/profile');
  return {};
}

export async function updateAvatarUrl(avatarUrl: string): Promise<{ error?: string }> {
  try {
    const supabase = createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Please sign in before uploading a profile photo.' };

    const { error } = await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', user.id);
    if (error) {
      console.error('Could not update profile avatar.', { code: error.code, message: error.message });
      return { error: 'We could not save your profile photo. Please try again.' };
    }

    revalidatePath('/profile');
    revalidatePath('/feed');
    revalidatePath('/sellers');
    return {};
  } catch (err) {
    console.error('Unexpected error in updateAvatarUrl:', err);
    return { error: 'Something went wrong while saving your profile photo. Please try again.' };
  }
}

export async function updateProfile(_: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  try {
    const supabase = createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Please sign in before updating your profile.' };

    // Insert first: every request is recorded, including malformed or unchanged requests.
    const auditClient = createServerSupabaseClient();
    if (!auditClient) throw new Error('Phone-change rate limiter is missing server configuration.');
    const { error: attemptError } = await auditClient.from('phone_update_attempts').insert({ user_id: user.id });
    if (attemptError) throw attemptError;
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await auditClient.from('phone_update_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('attempted_at', cutoff);
    if (countError) throw countError;
    if ((count ?? 0) > 3) return { error: 'You can change your phone number up to 3 times per week — try again later' };

    const parsed = phoneProfileSchema.safeParse({ phone: (formData.get('phone') as string) || undefined });
    if (!parsed.success) return { error: 'Enter a phone number of 20 characters or fewer.' };

    // Intentionally only phone: ignore all other submitted fields, even if tampered.
    const { error } = await supabase.from('users').update({ phone: parsed.data.phone ?? null }).eq('id', user.id);
    if (error) { console.error('Could not update phone.', error.message); return { error: 'We could not save your phone number. Please try again.' }; }
    revalidatePath('/profile'); revalidatePath('/feed'); return { saved: true };
  } catch (err) { console.error('Unexpected error in updateProfile:', err); return { error: 'Something went wrong. Please try again.' }; }
}
