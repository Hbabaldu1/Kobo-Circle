import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding-form';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export default async function OnboardingPage() {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Kobo Circle is intentionally single-estate at launch; streets still come from the database.
  const { data: estate } = await supabase.from('estates').select('id').limit(1).maybeSingle();
  const { data: streets } = estate
    ? await supabase.from('streets').select('id, name').eq('estate_id', estate.id).order('name')
    : { data: [] as Array<{ id: string; name: string }> };
  return <OnboardingForm streets={streets ?? []} />;
}
