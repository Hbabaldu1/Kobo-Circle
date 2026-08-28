import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding-form';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
export default async function OnboardingPage() { const supabase=createAuthServerClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user||!user.email_confirmed_at) redirect('/login'); const [{data:states},{data:lgas},{data:wards}]=await Promise.all([supabase.from('states').select('id, name').order('name'),supabase.from('lgas').select('id, state_id, name').order('name'),supabase.from('wards').select('id, lga_id, name').order('name')]); return <OnboardingForm states={states??[]} lgas={lgas??[]} wards={wards??[]}/>; }
