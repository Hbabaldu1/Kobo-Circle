'use client';

import Link from 'next/link';
import { ArrowLeft, Phone, Video, Settings } from 'lucide-react';
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
        <Link href="/messages" className="text-slate-300 hover:text-white" aria-label="Back to messages">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link href={`/sellers/${profileId}`} className="flex items-center gap-2.5">
          <UserAvatar id={profileId} name={name} avatarUrl={avatarUrl} className="h-9 w-9" />
          <span className="font-semibold text-base text-white truncate max-w-[160px]">{name}</span>
        </Link>
      </div>
      <div className="flex items-center gap-5 text-slate-300">
        <button type="button" aria-label="Start audio call" className="hover:text-white">
          <Phone className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Start video call" className="hover:text-white">
          <Video className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Conversation details" className="hover:text-white">
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
