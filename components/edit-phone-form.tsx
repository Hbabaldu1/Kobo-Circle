'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateProfile, type ProfileActionState } from '@/app/profile/actions';

const initialState: ProfileActionState = {};

function SubmitButton() { const { pending } = useFormStatus(); return <button className="mt-3 rounded-lg bg-adire px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 active:scale-95 disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100" disabled={pending}>{pending ? 'Saving…' : 'Save phone number'}</button>; }

export function EditPhoneForm({ phone }: { phone: string | null }) {
  const [state, action] = useFormState(updateProfile, initialState);
  return <form action={action}><label className="block text-sm font-semibold" htmlFor="phone">Phone number <span className="font-normal text-slate-500">(optional)</span><input id="phone" name="phone" defaultValue={phone ?? ''} maxLength={20} autoComplete="tel" inputMode="tel" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" /></label>{state.error && <p role="alert" className="mt-3 text-sm text-brick">{state.error}</p>}{state.saved && <p className="mt-3 text-sm text-leaf">Phone number saved.</p>}<SubmitButton /></form>;
}
