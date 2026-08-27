'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/feed', label: 'Home', icon: '⌂' },
  { href: '/new-listing', label: 'Add Post', icon: '+' },
  { href: '/messages', label: 'Messages', icon: '💬' },
  { href: '/profile', label: 'Profile', icon: '◉' },
];

export function MobileBottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  return <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(27,31,59,0.08)] backdrop-blur md:hidden">
    <div className="mx-auto grid max-w-lg grid-cols-4">
      {tabs.map((tab) => {
        const active = pathname === tab.href || (tab.href === '/messages' && pathname.startsWith('/messages'));
        return <Link key={tab.href} href={tab.href} className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${active ? 'text-adire' : 'text-slate-500'}`}>
          <span className="text-lg leading-none" aria-hidden="true">{tab.icon}</span><span>{tab.label}</span>
          {tab.href === '/messages' && unreadCount > 0 && <span className="absolute top-2 ml-5 min-w-4 rounded-full bg-brick px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </Link>;
      })}
    </div>
  </nav>;
}
