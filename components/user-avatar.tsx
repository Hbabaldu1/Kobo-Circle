'use client';

import Image from 'next/image';

interface UserAvatarProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  className?: string;
  isOnline?: boolean;
}

export function UserAvatar({ id, name, avatarUrl, className = 'h-10 w-10', isOnline }: UserAvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name || 'User avatar'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="rounded-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
          {initial}
        </div>
      )}

      {/* Online presence indicator */}
      {isOnline && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#121212]" />
      )}
    </div>
  );
}
