'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NavIcon } from '@/components/nav-icon';

const tabs = [
  { href: '/feed', label: 'Home', icon: 'home' as const },
  { href: '/new-listing', label: 'Add Post', icon: 'post' as const },
  { href: '/messages', label: 'Messages', icon: 'messages' as const },
  { href: '/profile', label: 'Profile', icon: 'profile' as const },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => { void (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: conversations } = await supabase.from('conversations').select('id').or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`);
    const ids = (conversations ?? []).map((conversation) => conversation.id);
    if (!ids.length) return;
    const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).in('conversation_id', ids).neq('sender_id', user.id).is('read_at', null);
    setUnreadCount(count ?? 0);
  })(); }, [supabase]);
  return <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(27,31,59,0.08)] md:hidden">
    <div className="mx-auto grid max-w-lg grid-cols-4">
      {tabs.map((tab) => {
        const active = pathname === tab.href || (tab.href === '/messages' && pathname.startsWith('/messages'));
        return <Link key={tab.href} href={tab.href} className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${active ? 'text-adire' : 'text-slate-500'}`}>
          <NavIcon name={tab.icon} className="h-5 w-5" /><span className={active ? 'font-bold' : ''}>{tab.label === 'Add Post' ? 'Post' : tab.label}</span>
          {tab.href === '/messages' && unreadCount > 0 && <span className="absolute top-2 ml-5 min-w-4 rounded-full bg-brick px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </Link>;
      })}
    </div>
  </nav>;
}
