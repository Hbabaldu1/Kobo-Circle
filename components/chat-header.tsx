'use client';

import Link from 'next/link';
import { UserAvatar } from '@/components/user-avatar';

interface ChatHeaderProps {
  name: string;
  avatarUrl: string | null;
  profileId: string;
  listingId?: string;
  phone?: string | null;
}

export function ChatHeader({ name, avatarUrl, profileId, phone }: ChatHeaderProps) {
  return (
    <header className="sticky top-auto z-40 mx-auto flex max-w-2xl items-center justify-between border-b border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-xs">
      <div className="flex items-center gap-3">
        <Link href="/messages" className="text-slate-600 hover:text-slate-900" aria-label="Back to messages">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <Link href={`/sellers/${profileId}`} className="flex items-center gap-2.5">
          <UserAvatar id={profileId} name={name} avatarUrl={avatarUrl} className="h-9 w-9" />
          <span className="max-w-[160px] truncate text-base font-semibold text-slate-900">{name}</span>
        </Link>
      </div>

      {phone && (
        <a
          href={`tel:${phone}`}
          aria-label="Call user"
          className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.828-1.587-5.112-3.871-6.7-6.7l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
        </a>
      )}
    </header>
  );
}
