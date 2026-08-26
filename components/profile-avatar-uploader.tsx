'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { updateAvatarUrl } from '@/app/profile/actions';
import { TrustRing } from '@/components/feed-list';
import { createClient } from '@/lib/supabase/client';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export function ProfileAvatarUploader({
  id,
  name,
  avatarUrl,
  percentage,
}: {
  id: string;
  name: string;
  avatarUrl?: string;
  percentage: number;
}) {
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [error, setError] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setError(undefined);

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for your profile photo.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError('Choose an image smaller than 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user || user.id !== id) throw new Error('Please sign in before uploading a profile photo.');

      const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '31536000',
        contentType: file.type,
        upsert: true,
      });
      if (uploadError) throw new Error(uploadError.message);

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl || undefined;
      if (!publicUrl) throw new Error('We could not get the URL for your profile photo.');

      const result = await updateAvatarUrl(publicUrl);
      if (result.error) throw new Error(result.error);

      setCurrentAvatarUrl(publicUrl);
      router.refresh();
    } catch (err) {
      console.error('Could not upload profile photo:', err);
      setError(err instanceof Error ? err.message : 'We could not upload your profile photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="shrink-0">
      <input ref={inputRef} id="profile-avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} aria-label="Upload profile photo" className="group relative rounded-full transition-transform duration-100 active:scale-95 disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none motion-reduce:active:scale-100">
        <TrustRing id={id} name={name} avatarUrl={currentAvatarUrl} percentage={percentage} />
        <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 px-1 text-center text-[10px] font-semibold text-white opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">{isUploading ? 'Uploading…' : 'Change'}</span>
      </button>
      {error && <p role="alert" className="mt-2 max-w-40 text-xs text-brick">{error}</p>}
    </div>
  );
}
