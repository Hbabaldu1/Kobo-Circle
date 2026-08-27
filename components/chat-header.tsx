// 'use client';

// import Link from 'next/link';
// import { ArrowLeft, Phone, Video, Settings } from 'lucide-react';
// import { UserAvatar } from '@/components/user-avatar';

// interface ChatHeaderProps {
//   name: string;
//   avatarUrl: string | null;
//   profileId: string;
//   listingId?: string;
// }

// export function ChatHeader({ name, avatarUrl, profileId }: ChatHeaderProps) {
//   return (
//     <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-[#121212] px-4 py-2.5">
//       <div className="flex items-center gap-3">
//         <Link href="/messages" className="text-slate-300 hover:text-white" aria-label="Back to messages">
//           <ArrowLeft className="h-5 w-5" />
//         </Link>
//         <Link href={`/sellers/${profileId}`} className="flex items-center gap-2.5">
//           <UserAvatar id={profileId} name={name} avatarUrl={avatarUrl} className="h-9 w-9" />
//           <span className="font-semibold text-base text-white truncate max-w-[160px]">{name}</span>
//         </Link>
//       </div>
//       <div className="flex items-center gap-5 text-slate-300">
//         <button type="button" aria-label="Start audio call" className="hover:text-white">
//           <Phone className="h-5 w-5" />
//         </button>
//         <button type="button" aria-label="Start video call" className="hover:text-white">
//           <Video className="h-5 w-5" />
//         </button>
//         <button type="button" aria-label="Conversation details" className="hover:text-white">
//           <Settings className="h-5 w-5" />
//         </button>
//       </div>
//     </header>
//   );
// }




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
        <Link href="/messages" className="text-slate-300 hover:text-white" aria-label="Back to messages">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <Link href={`/sellers/${profileId}`} className="flex items-center gap-2.5">
          <UserAvatar id={profileId} name={name} avatarUrl={avatarUrl} className="h-9 w-9" />
          <span className="max-w-[160px] truncate text-base font-semibold text-white">{name}</span>
        </Link>
      </div>
      <div className="flex items-center gap-5 text-slate-300">
        <button type="button" aria-label="Start audio call" className="hover:text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.828-1.587-5.112-3.871-6.7-6.7l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
        </button>
        <button type="button" aria-label="Start video call" className="hover:text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </button>
        <button type="button" aria-label="Settings" className="hover:text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
