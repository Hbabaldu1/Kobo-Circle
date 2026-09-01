import { notFound, redirect } from 'next/navigation';
import { SellerProfile } from '@/components/seller-profile';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

type VouchRow = { id: string; voucher_id: string; note: string | null; created_at: string };
type VoucherRow = { id: string; name: string; avatar_url: string | null };

export default async function SellerPage({ params }: { params: { id: string } }) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  // RLS on users limits this profile query to the viewer's LGA.
  const { data: seller } = await supabase.from('users').select('id, name, phone, avatar_url, ward_id, created_at').eq('id', params.id).maybeSingle();
  if (!seller) notFound();
  const [{ data: ward }, { data: trust }, { data: notes }, { data: latestListing }] = await Promise.all([
    seller.ward_id ? supabase.from('wards').select('name, lga_id').eq('id', seller.ward_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('seller_trust').select('community_vouch_count, tenure_vouch_count, transaction_vouch_count, trust_ratio').eq('user_id', seller.id).maybeSingle(),
    supabase.from('vouches').select('id, voucher_id, note, created_at').eq('vouched_for_id', seller.id).order('created_at', { ascending: false }),
    supabase.from('listings').select('title').eq('user_id', seller.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const { data: lga } = ward ? await supabase.from('lgas').select('name').eq('id', ward.lga_id).maybeSingle() : { data: null };
  const vouches = (notes ?? []) as VouchRow[];
  let voucherById = new Map<string, VoucherRow>();

  try {
    const voucherIds = Array.from(new Set(vouches.map((vouch) => vouch.voucher_id)));
    if (voucherIds.length) {
      const { data: voucherRows, error: voucherError } = await supabase.from('users').select('id, name, avatar_url').in('id', voucherIds);
      if (voucherError) throw voucherError;
      voucherById = new Map(((voucherRows ?? []) as VoucherRow[]).map((voucher) => [voucher.id, voucher]));
    }
  } catch (err) {
    console.error('Could not load voucher profiles:', err);
  }

  const vouchNotes = vouches.map((vouch) => {
    const voucher = voucherById.get(vouch.voucher_id);
    return {
      id: vouch.id,
      note: vouch.note,
      created_at: vouch.created_at,
      voucherId: vouch.voucher_id,
      voucherName: voucher?.name,
      voucherAvatarUrl: voucher?.avatar_url ?? undefined,
    };
  });

  return <SellerProfile sellerId={seller.id} name={seller.name} avatarUrl={seller.avatar_url ?? undefined} wardLgaName={ward ? `${ward.name}, ${lga?.name ?? 'Local Government'}` : 'Local neighbour'} initialVouchCounts={{ community: Number(trust?.community_vouch_count ?? 0), tenure: Number(trust?.tenure_vouch_count ?? 0), transaction: Number(trust?.transaction_vouch_count ?? 0) }} initialTrustRatio={Number(trust?.trust_ratio ?? 0)} phone={seller.phone} listingTitle={latestListing?.title ?? undefined} notes={vouchNotes} isOwner={seller.id === user.id} memberSince={seller.created_at} />;
}
