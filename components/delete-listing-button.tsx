'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { deleteListing, type DeleteListingState } from '@/app/listings/[id]/actions';

const initialState: DeleteListingState = {};

export function DeleteListingButton({ listingId, redirectTo, compact = false }: { listingId: string; redirectTo?: 'feed'; compact?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action] = useFormState(deleteListing, initialState);

  return (
    <form action={action} className={compact ? '' : 'mt-4'}>
      <input type="hidden" name="listingId" value={listingId} />
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      {state.error && <p role="alert" className="mb-2 text-sm text-brick">{state.error}</p>}
      {confirming ? (
        <div className="flex items-center gap-2">
          <DeleteSubmitButton compact={compact} />
          <button type="button" onClick={() => setConfirming(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Cancel</button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} aria-label="Delete listing" title="Delete listing" className={compact ? 'rounded-md p-2 text-brick transition-colors hover:bg-slate-100' : 'rounded-lg border border-brick px-3 py-2 text-sm font-semibold text-brick'}>{compact ? '×' : 'Delete listing'}</button>
      )}
    </form>
  );
}

function DeleteSubmitButton({ compact }: { compact: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="rounded-lg bg-brick px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{pending ? 'Deleting…' : compact ? 'Delete' : 'Confirm delete'}</button>;
}
