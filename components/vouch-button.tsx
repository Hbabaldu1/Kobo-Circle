'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createVouch, type VouchActionState } from '@/app/sellers/[id]/actions';

const initialState: VouchActionState = {};
export function VouchButton({ sellerId, onVouched }: { sellerId: string; onVouched: () => void }) {
  const [state, action] = useFormState(createVouch, initialState);
  useEffect(() => { if (state.vouched) onVouched(); }, [onVouched, state.vouched]);
  return <form action={action} className="mt-5"><input type="hidden" name="sellerId" value={sellerId} />{state.error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-brick">{state.error}</p>}{state.vouched ? <button disabled className="w-full rounded-lg bg-leaf px-4 py-3 font-semibold text-white">Vouched ✓</button> : <SubmitButton />}</form>;
}
function SubmitButton() { const { pending } = useFormStatus(); return <button disabled={pending} className="w-full rounded-lg bg-adire px-4 py-3 font-semibold text-white disabled:opacity-60">{pending ? 'Saving…' : 'Vouch for this neighbour'}</button>; }
