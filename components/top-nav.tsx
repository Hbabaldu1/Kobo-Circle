'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Home, MessageSquare, Plus, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/user-avatar';

const links = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/new-listing', label: 'Post', icon: Plus },
];

export function TopNav() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<{ id: string; name: string; avatar_url: string | null }>();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadNavigationData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: person }, { data: conversations }] = await Promise.all([
        supabase.from('users').select('id, name, avatar_url').eq('id', user.id).maybeSingle(),
        supabase.from('conversations').select('id, participant_one, participant_two').or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`),
      ]);
      if (person) setProfile(person);
      const ids = (conversations ?? []).map((conversation) => conversation.id);
      if (ids.length) {
        const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).in('conversation_id', ids).neq('sender_id', user.id).is('read_at', null);
        setUnreadCount(count ?? 0);
      } else {
        setUnreadCount(0);
      }
    }

    void loadNavigationData();
    const channel = supabase
      .channel('top-nav-unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => void loadNavigationData())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <header className="sticky top-0 z-40 hidden items-center justify-between border-b border-gray-200 bg-white px-6 py-2 shadow-sm md:flex">
      <div className="flex min-w-0 items-center gap-5">
        <Link href="/feed" className="font-heading text-xl font-bold text-adire">Kobo Circle</Link>
        <label className="relative">
          <span className="sr-only">Search listings</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" placeholder="Search Kobo Circle" className="w-52 rounded-full bg-slate-100 py-2 pl-9 pr-4 text-sm outline-none ring-adire focus:ring-2" />
        </label>
      </div>
      <nav aria-label="Main navigation" className="flex items-center gap-2">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <Link key={link.href} href={link.href} className={`flex items-center rounded-lg px-4 py-2 text-sm font-semibold ${pathname === link.href ? 'bg-adire/10 text-adire' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon aria-hidden="true" className="mr-2 h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-4">
        <Link href="/messages" aria-label="Unread messages" className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100">
          <Bell aria-hidden="true" className="h-5 w-5" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-brick px-1 text-center text-[10px] leading-5 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </Link>
        <Link href="/profile" className="flex items-center gap-2 rounded-full py-1 pr-2 hover:bg-slate-100">
          {profile && <UserAvatar id={profile.id} name={profile.name} avatarUrl={profile.avatar_url} />}
          <span className="max-w-28 truncate text-sm font-semibold text-ink">{profile?.name ?? 'Profile'}</span>
        </Link>
      </div>
    </header>
  );
}
