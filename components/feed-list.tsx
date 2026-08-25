'use client';

import { useState } from 'react';
import type { ListingType } from '@/types/database';

export type FeedListing = { id: string; type: ListingType; title: string; price: string | null; seller_name: string; street_name: string; vouch_count: number };
const filters: Array<{ label: string; type: ListingType | 'all' }> = [{ label: 'All', type: 'all' }, { label: 'For sale', type: 'sale' }, { label: 'Services', type: 'service' }, { label: 'Requests', type: 'request' }];

export function FeedList({ listings }: { listings: FeedListing[] }) {
  const [filter, setFilter] = useState<ListingType | 'all'>('all');
  const visible = filter === 'all' ? listings : listings.filter((listing) => listing.type === filter);
  return <><div className="mt-6 flex gap-2 overflow-x-auto pb-1">{filters.map(({ label, type }) => <button key={type} type="button" onClick={() => setFilter(type)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${filter === type ? 'bg-adire text-white' : 'bg-[#EFE7D6] text-ink'}`}>{label}</button>)}</div>
    <section className="mt-5 space-y-3" aria-live="polite">{visible.length ? visible.map((listing) => <ListingCard key={listing.id} listing={listing} />) : <p className="rounded-xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">No {filter === 'all' ? '' : filters.find((item) => item.type === filter)?.label.toLowerCase()} listings yet.</p>}</section></>;
}

function ListingCard({ listing }: { listing: FeedListing }) {
  const percentage = Math.min(listing.vouch_count / 12, 1) * 100;
  const label = listing.type === 'sale' ? 'For sale' : listing.type === 'service' ? 'Service' : 'Request';
  return <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brick">{label}</p><h2 className="mt-2 font-heading text-xl font-bold text-ink">{listing.title}</h2><p className="mt-1 font-semibold text-adire">{listing.type === 'request' || !listing.price ? 'Looking to buy' : listing.price}</p><div className="mt-4 flex items-center gap-3 border-t border-[#EFE7D6] pt-4"><TrustRing name={listing.seller_name} percentage={percentage} /><div><p className="font-semibold text-ink">{listing.seller_name}</p><p className="text-sm text-slate-600">{listing.street_name}</p></div><span className="ml-auto font-mono text-sm font-semibold text-adire">{Math.round(percentage)}%</span></div></article>;
}

function TrustRing({ name, percentage }: { name: string; percentage: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return <div aria-label={`${Math.round(percentage)}% neighbour trust`} className="grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#D9A441 ${percentage * 3.6}deg, #EFE7D6 0deg)` }}><div className="grid h-9 w-9 place-items-center rounded-full bg-paper font-heading font-bold text-adire">{initial}</div></div>;
}
