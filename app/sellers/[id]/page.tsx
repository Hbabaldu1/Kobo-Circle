import { notFound, redirect } from 'next/navigation';
import { SellerProfile } from '@/components/seller-profile';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export default async function SellerPage({ params }: { params: { id: string } }) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  // RLS on users limits this profile query to the viewer's estate.
  const { data: seller } = await supabase.from('users').select('id, name, phone, street_id').eq('id', params.id).maybeSingle();
  if (!seller) notFound();
  const [{ data: street }, { data: trust }, { data: notes }, { data: latestListing }] = await Promise.all([
    supabase.from('streets').select('name').eq('id', seller.street_id).maybeSingle(),
    supabase.from('seller_trust').select('vouch_count, trust_ratio').eq('user_id', seller.id).maybeSingle(),
    supabase.from('vouches').select('id, note, created_at').eq('vouched_for_id', seller.id).order('created_at', { ascending: false }),
    supabase.from('listings').select('title').eq('user_id', seller.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  return <SellerProfile sellerId={seller.id} name={seller.name} streetName={street?.name ?? 'Estate neighbour'} initialVouchCount={trust?.vouch_count ?? 0} initialTrustRatio={trust?.trust_ratio ?? 0} phone={seller.phone} listingTitle={latestListing?.title ?? null} notes={notes ?? []} isOwner={seller.id === user.id} />;
}
