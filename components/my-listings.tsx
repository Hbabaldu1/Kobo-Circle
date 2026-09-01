import Link from 'next/link';
import { DeleteListingButton } from '@/components/delete-listing-button';
import { ListingPhoto } from '@/components/listing-photo';
import { listingPriceLabel } from '@/lib/listing-price';
import type { ListingType } from '@/types/database';

type MyListing = { id: string; type: ListingType; title: string; price: string | null; photo_url: string | null; status: string };

export function MyListings({ listings }: { listings: MyListing[] }) {
  return <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="font-heading text-xl font-bold text-ink">My Listings</h2>{listings.length ? <div className="mt-4 space-y-4">{listings.map((listing) => <article key={listing.id} className="rounded-xl border border-[#EFE7D6] p-4"><div className="flex gap-3"><div className="w-20 shrink-0"><ListingPhoto photoUrl={listing.photo_url} type={listing.type} title={listing.title} /></div><div className="min-w-0"><Link href={`/listings/${listing.id}`} className="font-semibold text-ink hover:underline">{listing.title}</Link><p className="text-sm text-adire">{listingPriceLabel(listing.type, listing.price)}</p><p className="text-xs capitalize text-slate-500">{listing.status}</p></div></div><div className="mt-3 flex gap-2"><Link href={`/listings/${listing.id}/edit`} className="rounded-lg border border-adire px-3 py-2 text-sm font-semibold text-adire">Edit listing</Link><DeleteListingButton listingId={listing.id} /></div></article>)}</div> : <p className="mt-2 text-sm text-slate-600">You have not posted any listings yet.</p>}</section>;
}
