'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createListing, type ListingActionState } from '@/app/new-listing/actions';

const initialState: ListingActionState = {};

export function NewListingForm() {
  const [state, action] = useFormState(createListing, initialState);
  const [type, setType] = useState<'sale' | 'service' | 'request'>('sale');
  const router = useRouter();
  useEffect(() => { if (state.listingId) router.replace(`/feed?posted=${state.listingId}`); }, [router, state.listingId]);
  return <form action={action} className="mt-6 space-y-5">
    <fieldset><legend className="block text-sm font-semibold">Listing type</legend><div className="mt-2 grid grid-cols-3 gap-2">{(['sale', 'service', 'request'] as const).map((value) => <label key={value} className={`cursor-pointer rounded-lg border px-2 py-3 text-center text-sm font-semibold capitalize ${type === value ? 'border-adire bg-adire text-white' : 'border-slate-300 bg-white text-ink'}`}><input className="sr-only" type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} />{value}</label>)}</div></fieldset>
    <label className="block text-sm font-semibold" htmlFor="title">Title<input id="title" name="title" required maxLength={120} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal" /></label>
    <label className={`block text-sm font-semibold ${type === 'request' ? 'text-slate-400' : ''}`} htmlFor="price">Price <span className="font-normal">(optional)</span><input id="price" name="price" disabled={type === 'request'} maxLength={80} placeholder={type === 'request' ? 'Not needed for requests' : 'e.g. ₦15,000'} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal disabled:bg-slate-100" /></label>
    <label className="block text-sm font-semibold" htmlFor="description">Description <span className="font-normal">(optional)</span><textarea id="description" name="description" maxLength={500} rows={5} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal" /></label>
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-brick">{state.error}</p>}
    <SubmitButton />
  </form>;
}
function SubmitButton() { const { pending } = useFormStatus(); return <button disabled={pending} className="w-full rounded-lg bg-adire px-4 py-3 font-semibold text-white disabled:opacity-60">{pending ? 'Posting…' : 'Post listing'}</button>; }
