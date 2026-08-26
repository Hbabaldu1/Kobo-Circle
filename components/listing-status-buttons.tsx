'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateListingStatus, type ListingStatusActionState } from '@/app/listings/[id]/actions';
import type { ListingStatus } from '@/types/database';

const initialState: ListingStatusActionState = {};

export function ListingStatusButtons({ listingId, status }: { listingId: string; status: ListingStatus }) {
  const [state, action] = useFormState(updateListingStatus, initialState);
  if (status !== 'active') return null;
  return <form action={action} className="mt-5 space-y-3"><input type="hidden" name="listingId" value={listingId} />{state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-brick">{state.error}</p>}<div className="grid grid-cols-2 gap-3"><StatusButton status="sold" label="Mark as sold" /><StatusButton status="closed" label="Mark as closed" /></div></form>;
}

function StatusButton({ status, label }: { status: Exclude<ListingStatus, 'active'>; label: string }) {
  const { pending } = useFormStatus();
  return <button name="status" value={status} disabled={pending} className="rounded-lg bg-adire px-3 py-2 text-sm font-semibold text-white transition-transform duration-100 active:scale-95 disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100">{pending ? 'Saving…' : label}</button>;
}
