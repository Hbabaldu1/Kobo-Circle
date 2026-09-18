import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding-form';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export default async function OnboardingPage() {
  const supabase = createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    redirect('/login');
  }

  const [
    { data: states, error: statesError },
    { data: lgas, error: lgasError },
    { data: wards, error: wardsError },
  ] = await Promise.all([
    supabase.from('states').select('id, name').order('name'),
    supabase.from('lgas').select('id, state_id, name').order('name'),
    supabase.from('wards').select('id, lga_id, name').order('name'),
  ]);

  const locationErrors = [statesError, lgasError, wardsError].filter(Boolean);
  if (locationErrors.length > 0) {
    console.error('Failed to load onboarding locations:', locationErrors);
    throw new Error('Failed to load onboarding locations.');
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <OnboardingForm
        states={states ?? []}
        lgas={lgas ?? []}
        wards={wards ?? []}
      />
    </main>
  );
}
