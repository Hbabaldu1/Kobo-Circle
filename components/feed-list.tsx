'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserAvatar } from '@/components/user-avatar';
import type { ListingType } from '@/types/database';
import { WhatsAppShareButton } from '@/components/whatsapp-share-button';
import { ListingPhoto } from '@/components/listing-photo';

export type FeedListing = {
  id: string;
  user_id: string;
  type: ListingType;
  title: string;
  price: string | null;
  photo_url: string | null;
  seller_name: string;
  avatar_url: string | null;
  ward_lga_name: string;
  vouch_count: number;
  trust_ratio: number;
};

const filters: Array<{ label: string; type: ListingType | 'all' }> = [
  { label: 'All', type: 'all' },
  { label: 'For sale', type: 'sale' },
  { label: 'Services', type: 'service' },
  { label: 'Requests', type: 'request' },
];

export function FeedList({
  listings,
  currentUserId,
  postedListingId,
}: {
  listings: FeedListing[];
  currentUserId: string;
  postedListingId: string | null;
}) {
  const [filter, setFilter] = useState<ListingType | 'all'>('all');
  const visible = filter === 'all' ? listings : listings.filter((listing) => listing.type === filter);
  const posted = postedListingId ? listings.find((listing) => listing.id === postedListingId) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {posted && (
        <section className="mt-5 rounded-xl bg-[#EFE7D6] p-4">
          <p className="font-semibold text-ink">Your listing is live.</p>
          <WhatsAppShareButton id={posted.id} title={posted.title} price={posted.price} className="mt-3 bg-white" />
        </section>
      )}

      {/* Filter Bar: Left-aligned with padding on mobile, centered on desktop */}
      <div className="-mx-4 flex items-center justify-start gap-2 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:justify-center sm:px-0">
        {filters.map(({ label, type }) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-transform duration-100 active:scale-95 motion-reduce:transition-none ${
              filter === type ? 'bg-adire text-white shadow-xs' : 'bg-[#EFE7D6] text-ink hover:bg-[#E5DCB8]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {visible.length ? (
          visible.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              currentUserId={currentUserId}
              isOwner={listing.user_id === currentUserId}
            />
          ))
        ) : (
          <div className="col-span-full rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200">
            No {filter === 'all' ? '' : filters.find((item) => item.type === filter)?.label.toLowerCase()} listings yet.
          </div>
        )}
      </section>
    </div>
  );
}

function ListingCard({
  listing,
  currentUserId,
  isOwner,
}: {
  listing: FeedListing;
  currentUserId: string;
  isOwner: boolean;
}) {
  const percentage = Number(listing.trust_ratio) * 100;
  const label = listing.type === 'sale' ? 'For sale' : listing.type === 'service' ? 'Service' : 'Request';

  return (
    <article className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200 transition-shadow hover:shadow-md">
      <div>
        <ListingPhoto photoUrl={listing.photo_url} type={listing.type} title={listing.title} />
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-brick">{label}</p>
        <h2 className="mt-1.5 font-heading text-lg font-bold text-ink line-clamp-2">
          <Link href={`/listings/${listing.id}`} className="hover:underline">
            {listing.title}
          </Link>
        </h2>
        <p className="mt-1 font-semibold text-adire">
          {listing.type === 'request' || !listing.price ? 'Looking to buy' : listing.price}
        </p>
      </div>

      <div>
        <div className="mt-4 flex items-center gap-3 border-t border-[#EFE7D6] pt-4">
          <TrustRing
            id={listing.user_id}
            name={listing.seller_name}
            avatarUrl={listing.avatar_url ?? undefined}
            percentage={percentage}
            currentUserId={currentUserId}
          />
          <Link href={listing.user_id === currentUserId ? '/profile' : `/sellers/${listing.user_id}`} className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{listing.seller_name}</p>
            <p className="truncate text-xs text-slate-500">{listing.ward_lga_name}</p>
          </Link>
          <span className="font-mono text-sm font-semibold text-adire">{Math.round(percentage)}%</span>
        </div>
        {isOwner && <WhatsAppShareButton id={listing.id} title={listing.title} price={listing.price} className="mt-4 w-full" />}
      </div>
    </article>
  );
}

export function TrustRing({
  id,
  name,
  avatarUrl,
  percentage,
  currentUserId,
  animate = false,
}: {
  id: string;
  name: string;
  avatarUrl?: string;
  percentage: number;
  currentUserId?: string;
  animate?: boolean;
}) {
  const ring = (
    <div
      aria-label={`${Math.round(percentage)}% neighbour trust`}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-[background] duration-150 ${
        animate ? 'animate-success-pop' : ''
      }`}
      style={{ background: `conic-gradient(#D9A441 ${percentage * 3.6}deg, #EFE7D6 0deg)` }}
    >
      <div className="grid h-8 w-8 place-items-center rounded-full bg-paper">
        <UserAvatar id={id} name={name} avatarUrl={avatarUrl} className="h-7 w-7 text-xs" />
      </div>
    </div>
  );

  const avatarHref = currentUserId ? (id === currentUserId ? '/profile' : `/sellers/${id}`) : `/sellers/${id}`;

  return (
    <Link href={avatarHref} className="cursor-pointer transition-opacity hover:opacity-90">
      {ring}
    </Link>
  );
}
