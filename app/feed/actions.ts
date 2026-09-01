'use server';

import { createAuthServerClient } from '@/lib/supabase/auth-server';
import type { FeedListing } from '@/components/feed-list';

export type DiscoveryScope = 'nearby' | 'lga' | 'state';

export async function getListingsForScope(scope: DiscoveryScope): Promise<FeedListing[]> {
  try {
    const supabase = createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data: profile } = await supabase.from('users').select('state_id,lga_id,ward_id').eq('id', user.id).maybeSingle();
    if (!profile) return [];

    let query = supabase.from('listings').select('id,user_id,type,title,price,photo_url,ward_id,lga_id').eq('status', 'active').order('created_at', { ascending: false });
    query = scope === 'state' ? query.eq('state_id', profile.state_id) : scope === 'lga' || !profile.ward_id ? query.eq('lga_id', profile.lga_id) : query.eq('ward_id', profile.ward_id);
    const { data: listingRows, error } = await query;
    if (error) { console.error('Could not load discovery listings.', { code: error.code, message: error.message }); return []; }
    const listings = listingRows ?? [];
    const sellerIds = [...new Set(listings.map((listing) => listing.user_id))];
    const wardIds = [...new Set(listings.map((listing) => listing.ward_id).filter((id): id is string => Boolean(id)))];
    const lgaIds = [...new Set(listings.map((listing) => listing.lga_id))];
    const [{ data: sellers }, { data: wards }, { data: lgas }, { data: trusts }] = await Promise.all([
      sellerIds.length ? supabase.from('users').select('id,name,avatar_url').in('id', sellerIds) : Promise.resolve({ data: [] }),
      wardIds.length ? supabase.from('wards').select('id,name,lga_id').in('id', wardIds) : Promise.resolve({ data: [] }),
      lgaIds.length ? supabase.from('lgas').select('id,name').in('id', lgaIds) : Promise.resolve({ data: [] }),
      sellerIds.length ? supabase.from('seller_trust').select('user_id,community_vouch_count,tenure_vouch_count,transaction_vouch_count,weighted_score,trust_ratio').in('user_id', sellerIds) : Promise.resolve({ data: [] }),
    ]);
    const sellerById = new Map((sellers ?? []).map((seller) => [seller.id, seller]));
    const wardById = new Map((wards ?? []).map((ward) => [ward.id, ward]));
    const lgaById = new Map((lgas ?? []).map((lga) => [lga.id, lga]));
    const trustById = new Map((trusts ?? []).map((trust) => [trust.user_id, trust]));
    return listings.flatMap((listing): FeedListing[] => {
      const seller = sellerById.get(listing.user_id);
      if (!seller) return [];
      const ward = listing.ward_id ? wardById.get(listing.ward_id) : undefined;
      const trust = trustById.get(listing.user_id);
      const vouchCount = Number(trust?.community_vouch_count ?? 0) + Number(trust?.tenure_vouch_count ?? 0) + Number(trust?.transaction_vouch_count ?? 0);
      return [{ ...listing, seller_name: seller.name, avatar_url: seller.avatar_url, ward_name: ward?.name ?? null, ward_lga_name: ward ? `${ward.name}, ${lgaById.get(listing.lga_id)?.name ?? 'Local Government'}` : lgaById.get(listing.lga_id)?.name ?? 'Local neighbour', vouch_count: vouchCount, trust_ratio: trust?.trust_ratio ?? 0 }];
    });
  } catch (err) {
    console.error('Unexpected error in getListingsForScope:', err);
    return [];
  }
}
