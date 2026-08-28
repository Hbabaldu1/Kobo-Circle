'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { NavIcon } from '@/components/nav-icon';
import { createClient } from '@/lib/supabase/client';

const tabs = [
  { href: '/feed', label: 'Feed', icon: 'home' },
  { href: '/new-listing', label: 'Add Post', icon: 'post' },
  { href: '/messages', label: 'Messages', icon: 'messages' },
  { href: '/profile', label: 'Profile', icon: 'profile' },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadUnreadCount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`);
      const ids = (conversations ?? []).map((conversation) => conversation.id);
      if (!ids.length) {
        setUnreadCount(0);
        return;
      }
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', ids)
        .neq('sender_id', user.id)
        .is('read_at', null);
      setUnreadCount(count ?? 0);
    }

    void loadUnreadCount();
    const channel = supabase
      .channel('mobile-nav-unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => void loadUnreadCount())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  return <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(27,31,59,0.08)] backdrop-blur md:hidden">
    <div className="sticky mx-auto grid max-w-lg grid-cols-4">
      {tabs.map((tab) => {
        const active = pathname === tab.href || (tab.href === '/messages' && pathname.startsWith('/messages'));
        return <Link key={tab.href} href={tab.href} aria-label={tab.label} className={`relative flex min-h-16 items-center justify-center ${active ? 'text-adire' : 'text-slate-500'}`}>
          <NavIcon name={tab.icon} className="h-6 w-6" />
          {tab.href === '/messages' && unreadCount > 0 && <span className="absolute top-2 ml-5 min-w-4 rounded-full bg-brick px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </Link>;
      })}
    </div>
  </nav>;
}
