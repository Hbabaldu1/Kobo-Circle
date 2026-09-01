import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { DeleteListingButton } from '@/components/delete-listing-button';

/**
 * Actions are deliberately rendered only from the server-confirmed ownership
 * result. Keeping that condition at this boundary prevents a stale client
 * session or an omitted prop from exposing listing-management controls.
 */
export function ListingOwnerActions({ listingId, isOwner }: { listingId: string; isOwner: boolean }) {
  if (!isOwner) return null;

  return (
    <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-lg bg-white/95 p-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/95">
      <Link href={`/listings/${listingId}/edit`} aria-label="Edit listing" title="Edit listing" className="rounded-md p-2 text-adire transition-colors hover:bg-slate-100">
        <Pencil className="h-4 w-4" />
      </Link>
      <DeleteListingButton listingId={listingId} redirectTo="feed" compact />
    </div>
  );
}
