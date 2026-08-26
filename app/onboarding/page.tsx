import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding-form';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export default async function OnboardingPage() {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) redirect('/login');

  // Streets are readable during onboarding before a users row exists; estates are not.
  const { data: streets } = await supabase.from('streets').select('id, name').order('name');
  return <OnboardingForm streets={streets ?? []} />;
}
