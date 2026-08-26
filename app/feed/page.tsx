import { redirect } from 'next/navigation';
import { FeedList, type FeedListing } from '@/components/feed-list';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { LogoutButton } from '@/components/logout-button';

export const revalidate = 60;

type ListingRow = {
  id: string;
  user_id: string;
  estate_id: string;
  type: FeedListing['type'];
  title: string;
  price: string | null;
  description: string | null;
  status: 'active' | 'sold' | 'closed';
  created_at: string;
  photo_url: string | null;
};

type SellerRow = { id: string; name: string; avatar_url: string | null; street_id: string };
type StreetRow = { id: string; name: string };
type TrustRow = { user_id: string; vouch_count: number; trust_ratio: number };

export default async function FeedPage({ searchParams }: { searchParams: { posted?: string } }) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) redirect('/login');

  const { data: profile } = await supabase.from('users').select('estate_id').eq('id', user.id).maybeSingle();
  if (!profile) redirect('/onboarding');

  const { data: listingRows } = await supabase
    .from('listings')
    .select('id, user_id, estate_id, type, title, price, description, status, created_at, photo_url')
    .eq('estate_id', profile.estate_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const listingsData = (listingRows ?? []) as ListingRow[];
  const sellerIds = Array.from(new Set(listingsData.map((listing) => listing.user_id)));

  const [{ data: sellerRows }, { data: trustRows }] = sellerIds.length
    ? await Promise.all([
        supabase.from('users').select('id, name, avatar_url, street_id').in('id', sellerIds),
        supabase.from('seller_trust').select('user_id, vouch_count, trust_ratio').in('user_id', sellerIds),
      ])
    : [{ data: [] as SellerRow[] }, { data: [] as TrustRow[] }];

  const sellers = (sellerRows ?? []) as SellerRow[];
  const streetIds = Array.from(new Set(sellers.map((seller) => seller.street_id)));
  const { data: streetRows } = streetIds.length
    ? await supabase.from('streets').select('id, name').in('id', streetIds)
    : { data: [] as StreetRow[] };

  const sellerById = new Map(sellers.map((seller) => [seller.id, seller]));
  const streetById = new Map(((streetRows ?? []) as StreetRow[]).map((street) => [street.id, street]));
  const trustByUserId = new Map(((trustRows ?? []) as TrustRow[]).map((trust) => [trust.user_id, trust]));

  const listings = listingsData.flatMap((listing): FeedListing[] => {
    const seller = sellerById.get(listing.user_id);
    if (!seller) return [];
    const trust = trustByUserId.get(listing.user_id);
    return [{
      id: listing.id,
      user_id: listing.user_id,
      type: listing.type,
      title: listing.title,
      price: listing.price,
      photo_url: listing.photo_url,
      seller_name: seller.name,
      avatar_url: seller.avatar_url,
      street_name: streetById.get(seller.street_id)?.name ?? 'Estate neighbour',
      vouch_count: trust?.vouch_count ?? 0,
      trust_ratio: trust?.trust_ratio ?? 0,
    }];
  });

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10 lg:max-w-6xl">
      {/* Header section with clean button layout */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-adire">Kobo Circle</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-ink">Your estate feed</h1>
          <p className="mt-2 text-sm text-slate-600">Trusted finds and helpful neighbours, close to home.</p>
        </div>

        {/* Repositioned Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <a href="/new-listing" className="rounded-lg bg-adire px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
            Post listing
          </a>
          <LogoutButton />
        </div>
      </div>

      {/* Feed Content */}
      {listings.length ? (
        <FeedList listings={listings} currentUserId={user.id} postedListingId={searchParams.posted ?? null} />
      ) : (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-heading text-xl font-bold text-ink">Start the conversation</h2>
          <p className="mt-2 leading-6 text-slate-600">There are no listings in your estate yet. Be the first neighbour to share something useful.</p>
          <a href="/new-listing" className="mt-4 inline-block rounded-lg bg-adire px-4 py-3 font-semibold text-white">
            Post a listing
          </a>
        </section>
      )}
    </main>
  );
}
