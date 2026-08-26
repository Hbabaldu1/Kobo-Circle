'use client';

import Image from 'next/image';
import { useEffect, useState, useTransition, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createListing, type ListingActionState } from '@/app/new-listing/actions';
import { createClient } from '@/lib/supabase/client';

const initialState: ListingActionState = {};
const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxPhotoSize = 5 * 1024 * 1024;

export function NewListingForm() {
  const [state, setState] = useState<ListingActionState>(initialState);
  const [type, setType] = useState<'sale' | 'service' | 'request'>('sale');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => { if (state.listingId) router.replace(`/feed?posted=${state.listingId}`); }, [router, state.listingId]);
  useEffect(() => () => { if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl); }, [photoPreviewUrl]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedPhoto = event.target.files?.[0];
    setState(initialState);

    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);

    if (!selectedPhoto) {
      setPhoto(null);
      setPhotoPreviewUrl(null);
      return;
    }

    if (!acceptedImageTypes.includes(selectedPhoto.type)) {
      event.target.value = '';
      setPhoto(null);
      setPhotoPreviewUrl(null);
      setState({ error: 'Choose a JPEG, PNG, or WebP image.' });
      return;
    }

    if (selectedPhoto.size > maxPhotoSize) {
      event.target.value = '';
      setPhoto(null);
      setPhotoPreviewUrl(null);
      setState({ error: 'Choose an image smaller than 5MB.' });
      return;
    }

    setPhoto(selectedPhoto);
    setPhotoPreviewUrl(URL.createObjectURL(selectedPhoto));
  }

  async function uploadPhoto(selectedPhoto: File): Promise<string> {
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) throw new Error('Please sign in before uploading a photo.');

      const extension = selectedPhoto.type === 'image/png' ? 'png' : selectedPhoto.type === 'image/webp' ? 'webp' : 'jpg';
      const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('listing-photos').upload(filePath, selectedPhoto, {
        cacheControl: '31536000',
        contentType: selectedPhoto.type,
        upsert: false,
      });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from('listing-photos').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error('Could not upload listing photo:', err);
      throw err;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState(initialState);

    startTransition(async () => {
      try {
        const formData = new FormData(form);

        if (photo) {
          const photoUrl = await uploadPhoto(photo);
          formData.set('photo_url', photoUrl);
        }

        const result = await createListing(initialState, formData);
        setState(result);
      } catch (err) {
        console.error('Listing submission failed:', err);
        setState({ error: 'We could not upload your photo. Please try again before posting.' });
      }
    });
  }

  return <form onSubmit={handleSubmit} className="mt-6 space-y-5">
    <fieldset disabled={isPending}><legend className="block text-sm font-semibold">Listing type</legend><div className="mt-2 grid grid-cols-3 gap-2">{(['sale', 'service', 'request'] as const).map((value) => <label key={value} className={`cursor-pointer rounded-lg border px-2 py-3 text-center text-sm font-semibold capitalize ${type === value ? 'border-adire bg-adire text-white' : 'border-slate-300 bg-white text-ink'}`}><input className="sr-only" type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} />{value}</label>)}</div></fieldset>
    <label className="block text-sm font-semibold" htmlFor="title">Title<input id="title" name="title" required maxLength={120} disabled={isPending} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal disabled:bg-slate-100" /></label>
    <label className={`block text-sm font-semibold ${type === 'request' ? 'text-slate-400' : ''}`} htmlFor="price">Price <span className="font-normal">(optional)</span><input id="price" name="price" disabled={isPending || type === 'request'} maxLength={80} placeholder={type === 'request' ? 'Not needed for requests' : 'e.g. ₦15,000'} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal disabled:bg-slate-100" /></label>
    <label className="block text-sm font-semibold" htmlFor="description">Description <span className="font-normal">(optional)</span><textarea id="description" name="description" maxLength={500} rows={5} disabled={isPending} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal disabled:bg-slate-100" /></label>
    <div><label className="block text-sm font-semibold" htmlFor="photo">Photo <span className="font-normal">(optional)</span></label><input id="photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={isPending} onChange={handlePhotoChange} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm disabled:bg-slate-100" /><p className="mt-1 text-xs font-normal text-slate-500">JPEG, PNG, or WebP only. Max 5MB.</p>{photoPreviewUrl && <Image src={photoPreviewUrl} alt="Selected listing photo preview" width={160} height={120} className="mt-3 h-24 w-32 rounded-lg object-cover ring-1 ring-slate-200" unoptimized />}</div>
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-brick">{state.error}</p>}
    <SubmitButton pending={isPending} />
  </form>;
}
function SubmitButton({ pending }: { pending: boolean }) { return <button disabled={pending} className="w-full rounded-lg bg-adire px-4 py-3 font-semibold text-white disabled:opacity-60">{pending ? 'Posting…' : 'Post listing'}</button>; }
