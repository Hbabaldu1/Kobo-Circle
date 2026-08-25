import { redirect } from 'next/navigation';
import { FeedList, type FeedListing } from '@/components/feed-list';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export const revalidate = 60;

export default async function FeedPage() {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) redirect('/login');
  const { data: profile } = await supabase.from('users').select('estate_id').eq('id', user.id).maybeSingle();
  if (!profile) redirect('/onboarding');
  // The RPC is security-invoker and RLS limits its source rows to this estate.
  const { data } = await supabase.rpc('listings_with_trust');
  const listings = (data ?? []).filter((listing) => listing.estate_id === profile.estate_id) as FeedListing[];
  return <main className="mx-auto min-h-screen max-w-lg px-5 py-10"><p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-adire">Kobo Circle</p><h1 className="mt-2 font-heading text-3xl font-bold text-ink">Your estate feed</h1><p className="mt-2 text-sm text-slate-600">Trusted finds and helpful neighbours, close to home.</p>{listings.length ? <FeedList listings={listings} /> : <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="font-heading text-xl font-bold text-ink">Start the conversation</h2><p className="mt-2 leading-6 text-slate-600">There are no listings in your estate yet. Be the first neighbour to share something useful.</p></section>}</main>;
}
