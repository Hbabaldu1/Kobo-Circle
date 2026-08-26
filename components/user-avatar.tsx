'use client';

import { useEffect, useState } from 'react';

// Brand palette for initial fallback avatars
const AVATAR_COLORS = [
  'bg-[#4A2E2B] text-white', // adire
  'bg-[#2D5F3E] text-white', // leaf
  'bg-[#A64B2A] text-white', // brick
  'bg-[#D9A441] text-ink',   // ochre
];

function getHashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function UserAvatar({
  id,
  name,
  avatarUrl,
  className = 'h-8 w-8 text-sm',
}: {
  id: string;
  name: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const colorClass = getHashColor(id);
  const initial = name ? name.trim().charAt(0).toUpperCase() : '?';

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`grid place-items-center rounded-full font-bold uppercase shrink-0 ${colorClass} ${className}`}
      aria-label={name}
    >
      {initial}
    </div>
  );
}
