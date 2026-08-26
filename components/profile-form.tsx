'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updateProfile, type ProfileActionState } from '@/app/profile/actions';

const initialState: ProfileActionState = {};

type ProfileFormProps = {
  name: string;
  phone: string | null;
  streetId: string;
  streets: Array<{ id: string; name: string }>;
};

export function ProfileForm({ name, phone, streetId, streets }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, action] = useFormState(updateProfile, initialState);

  useEffect(() => { if (state.saved) setIsEditing(false); }, [state.saved]);

  if (!isEditing) {
    return <button type="button" onClick={() => setIsEditing(true)} className="mt-6 w-full rounded-lg bg-adire px-4 py-3 font-semibold text-white transition-transform duration-100 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100">Edit profile</button>;
  }

  return <form action={action} className="mt-6 space-y-4"><label className="block text-sm font-semibold" htmlFor="profile-name">Name<input id="profile-name" name="name" required defaultValue={name} maxLength={60} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal" /></label><label className="block text-sm font-semibold" htmlFor="profile-phone">Phone <span className="font-normal text-slate-500">(optional)</span><input id="profile-phone" name="phone" defaultValue={phone ?? ''} maxLength={20} autoComplete="tel" inputMode="tel" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal" /></label><label className="block text-sm font-semibold" htmlFor="profile-street">Street<select id="profile-street" name="streetId" required defaultValue={streetId} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal">{streets.map((street) => <option key={street.id} value={street.id}>{street.name}</option>)}</select></label>{state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-brick">{state.error}</p>}<div className="flex gap-3"><button type="button" onClick={() => setIsEditing(false)} className="flex-1 rounded-lg border border-adire px-4 py-3 font-semibold text-adire transition-transform duration-100 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100">Cancel</button><SubmitButton /></div></form>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="flex-1 rounded-lg bg-adire px-4 py-3 font-semibold text-white transition-transform duration-100 active:scale-95 disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100">{pending ? 'Saving…' : 'Save profile'}</button>;
}
