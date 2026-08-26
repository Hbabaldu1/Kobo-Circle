'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateListing, type EditListingState } from '@/app/listings/[id]/actions';
import type { ListingStatus, ListingType } from '@/types/database';

const initialState: EditListingState = {};

type EditListingFormProps = {
  listing: {
    id: string;
    type: ListingType;
    title: string;
    price: string | null;
    description: string | null;
    status: ListingStatus;
  };
};

export function EditListingForm({ listing }: EditListingFormProps) {
  const [state, action] = useFormState(updateListing, initialState);
  return <form action={action} className="mt-6 space-y-5"><input type="hidden" name="listingId" value={listing.id} /><input type="hidden" name="type" value={listing.type} /><div className="rounded-lg bg-[#EFE7D6] p-3 text-sm text-slate-700">Listing type is fixed as <span className="font-semibold capitalize text-ink">{listing.type}</span>. Post a new listing if you need a different type.</div><label className="block text-sm font-semibold" htmlFor="title">Title<input id="title" name="title" required defaultValue={listing.title} maxLength={120} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal" /></label><label className={`block text-sm font-semibold ${listing.type === 'request' ? 'text-slate-400' : ''}`} htmlFor="price">Price <span className="font-normal">(optional)</span><input id="price" name="price" disabled={listing.type === 'request'} defaultValue={listing.price ?? ''} maxLength={80} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal disabled:bg-slate-100" /></label><label className="block text-sm font-semibold" htmlFor="description">Description <span className="font-normal">(optional)</span><textarea id="description" name="description" defaultValue={listing.description ?? ''} maxLength={500} rows={5} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal" /></label><label className="block text-sm font-semibold" htmlFor="status">Status<select id="status" name="status" defaultValue={listing.status} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal"><option value="active">Active</option><option value="sold">Sold</option><option value="closed">Closed</option></select></label>{state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-brick">{state.error}</p>}{state.saved && <p className="rounded-lg bg-leaf/10 p-3 text-sm text-leaf">Listing saved.</p>}<SubmitButton /></form>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="w-full rounded-lg bg-adire px-4 py-3 font-semibold text-white transition-transform duration-100 active:scale-95 disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100">{pending ? 'Saving…' : 'Save listing'}</button>;
}
