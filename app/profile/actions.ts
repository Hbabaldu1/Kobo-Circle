'use server';

import { revalidatePath } from 'next/cache';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { userProfileSchema } from '@/lib/validation';

export type ProfileActionState = { error?: string; saved?: true };

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
  const parsed = userProfileSchema.safeParse({ name: formData.get('name'), wardId: formData.get('wardId'), phone: (formData.get('phone') as string) || undefined });
  if (!parsed.success || !parsed.data.wardId) return { error: 'Enter your name, choose a ward, and check your optional phone number.' };
  try { const supabase=createAuthServerClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return {error:'Please sign in before updating your profile.'}; const {data:ward,error:wardError}=await supabase.from('wards').select('lga_id').eq('id',parsed.data.wardId).maybeSingle(); if(wardError||!ward)return {error:'We could not verify that ward. Please try again.'}; const {data:lga,error:lgaError}=await supabase.from('lgas').select('state_id').eq('id',ward.lga_id).maybeSingle(); if(lgaError||!lga)return {error:'We could not verify that ward. Please try again.'}; const {error}=await supabase.from('users').update({name:parsed.data.name,phone:parsed.data.phone,ward_id:parsed.data.wardId,lga_id:ward.lga_id,state_id:lga.state_id}).eq('id',user.id); if(error){console.error('Could not update profile.',error.message);return {error:'We could not save your profile. Please try again.'};} revalidatePath('/profile');revalidatePath('/feed');return {saved:true}; } catch(err){console.error('Unexpected error in updateProfile:',err);return {error:'Something went wrong. Please try again.'};}
}
