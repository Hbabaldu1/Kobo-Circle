'use client';

import Link from 'next/link';
import { UserAvatar } from '@/components/user-avatar';

interface ChatHeaderProps {
  name: string;
  avatarUrl: string | null;
  profileId: string;
  listingId?: string;
}

export function ChatHeader({ name, avatarUrl, profileId }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-[#121212] px-4 py-2.5">
      <div className="flex items-center gap-3">
        <Link href="/messages" className="text-xl text-white hover:text-slate-300" aria-label="Back to conversations">
          ←
        </Link>
        <Link href={`/sellers/${profileId}`} className="flex items-center gap-2.5">
          <UserAvatar id={profileId} name={name} avatarUrl={avatarUrl} className="h-9 w-9" />
          <span className="font-semibold text-base text-white truncate max-w-[160px]">{name}</span>
        </Link>
      </div>
      <div className="flex items-center gap-5 text-xl text-white">
        <button type="button" aria-label="Start audio call">📞</button>
        <button type="button" aria-label="Start video call">📹</button>
        <button type="button" aria-label="Conversation details">⚙</button>
      </div>
    </header>
  );
}
