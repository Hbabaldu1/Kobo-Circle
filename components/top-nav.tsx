'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/user-avatar';
import { NavIcon } from '@/components/nav-icon';

const links = [{ href: '/feed', label: 'Feed', icon: 'home' as const }, { href: '/messages', label: 'Messages', icon: 'messages' as const }, { href: '/new-listing', label: 'Post', icon: 'post' as const }];

export function TopNav() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<{ id: string; name: string; avatar_url: string | null }>();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    void (async () => {
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
      }
    })();
  }, [supabase]);

  return <header className="sticky top-0 z-40 hidden w-full items-center justify-between border-b border-gray-200 bg-white px-6 py-2 shadow-sm md:flex">
    <div className="flex min-w-0 items-center gap-5"><Link href="/feed" className="font-heading text-xl font-bold text-adire">Kobo Circle</Link><label className="relative"><span className="sr-only">Search listings</span><NavIcon name="search" className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input type="search" placeholder="Search Kobo Circle" className="w-52 rounded-full bg-slate-100 py-2 pl-9 pr-4 text-sm outline-none ring-adire focus:ring-2" /></label></div>
    <nav aria-label="Main navigation" className="flex items-center gap-2">{links.map((link) => <Link key={link.href} href={link.href} className={`flex items-center rounded-lg px-4 py-2 text-sm font-semibold ${pathname === link.href ? 'bg-adire/10 text-adire' : 'text-slate-600 hover:bg-slate-100'}`}><NavIcon name={link.icon} className="mr-2 h-4 w-4" />{link.label}</Link>)}</nav>
    <div className="flex items-center gap-4"><Link href="/messages" aria-label="Unread messages" className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"><NavIcon name="notifications" />{unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-brick px-1 text-center text-[10px] leading-5 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}</Link><Link href="/profile" className="flex items-center gap-2 rounded-full py-1 pr-2 hover:bg-slate-100">{profile && <UserAvatar id={profile.id} name={profile.name} avatarUrl={profile.avatar_url} />}<span className="max-w-28 truncate text-sm font-semibold text-ink">{profile?.name ?? 'Profile'}</span></Link></div>
  </header>;
}
