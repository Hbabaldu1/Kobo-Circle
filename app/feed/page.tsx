import { redirect } from 'next/navigation';
import { FeedList } from '@/components/feed-list';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { getListingsForScope } from './actions';

export const revalidate = 60;

export default async function FeedPage({ searchParams }: { searchParams: { posted?: string } }) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) redirect('/login');
  const { data: profile } = await supabase.from('users').select('state_id,lga_id,ward_id').eq('id', user.id).maybeSingle();
  if (!profile?.lga_id || !profile.state_id) redirect('/onboarding');
  const [{ data: lga }, { data: state }, listings] = await Promise.all([
    supabase.from('lgas').select('name').eq('id', profile.lga_id).maybeSingle(),
    supabase.from('states').select('name').eq('id', profile.state_id).maybeSingle(),
    getListingsForScope('nearby'),
  ]);
  return <main className="mx-auto min-h-screen max-w-2xl px-4 py-6 lg:max-w-6xl"><FeedList listings={listings} currentUserId={user.id} postedListingId={searchParams.posted ?? null} discovery={{ lgaName: lga?.name ?? 'Local Government', stateName: state?.name ?? 'State', nearbyUsesWard: Boolean(profile.ward_id) }} /></main>;
}
