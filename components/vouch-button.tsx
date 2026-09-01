'use client';
import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createVouch, type VouchActionState } from '@/app/sellers/[id]/actions';
const initialState: VouchActionState = {};
const vouchTypes = [
  { value: 'community', label: 'Community', description: 'They are a trusted member of the neighbourhood.' },
  { value: 'tenure', label: 'Tenure', description: 'You have seen them operating locally over time.' },
  { value: 'transaction', label: 'Transaction', description: 'You have completed a transaction with them.' },
] as const;

export function VouchButton({ sellerId, onVouched }: { sellerId: string; onVouched: () => void }) {
  const [state, action] = useFormState(createVouch, initialState);
  const [vouchType, setVouchType] = useState<(typeof vouchTypes)[number]['value']>('community');

  useEffect(() => {
    if (state.vouched) onVouched();
  }, [onVouched, state.vouched]);

  return <form action={action} className="mt-5">
    <input type="hidden" name="sellerId" value={sellerId} />
    {state.error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-brick">{state.error}</p>}
    <fieldset className="mb-4">
      <legend className="mb-2 text-sm font-semibold text-ink">What are you vouching for?</legend>
      <div className="space-y-2">
        {vouchTypes.map((type) => <label key={type.value} className="flex cursor-pointer gap-3 rounded-lg bg-paper p-3 text-sm text-ink ring-1 ring-slate-200 has-[:checked]:ring-adire">
          <input type="radio" name="vouchType" value={type.value} checked={vouchType === type.value} onChange={() => setVouchType(type.value)} className="mt-0.5 h-4 w-4 border-slate-300 text-adire focus:ring-adire" />
          <span><span className="block font-semibold">{type.label}</span><span className="text-xs text-slate-600">{type.description}</span></span>
        </label>)}
      </div>
    </fieldset>
    {state.vouched ? <div role="status" className="rounded-xl bg-leaf/10 p-4 text-center text-leaf"><span className="inline-block text-2xl animate-success-pop motion-reduce:animate-none">✓</span><p className="mt-1 font-semibold">Thank you for strengthening your community 🤝</p></div> : <SubmitButton />}
  </form>;
}
function SubmitButton(){const {pending}=useFormStatus();return <button disabled={pending} className="w-full rounded-lg bg-adire px-4 py-3 font-semibold text-white transition-transform duration-100 active:scale-95 disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100">{pending?'Saving…':'Vouch for this neighbour'}</button>;}
