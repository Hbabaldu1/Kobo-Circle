import Link from 'next/link';
import { UserAvatar } from '@/components/user-avatar';
import { NavIcon } from '@/components/nav-icon';

export function ChatHeader({ name, avatarUrl, profileId, listingId }: { name: string; avatarUrl: string | null; profileId: string; listingId?: string }) {
  return <header className="flex items-center justify-between border-b border-[#E9DFCF] bg-paper px-4 py-3"><Link href="/messages" aria-label="Back to conversations" className="rounded-full p-2 text-adire hover:bg-white"><NavIcon name="back" /></Link><div className="flex min-w-0 items-center gap-3"><UserAvatar id={profileId} name={name} avatarUrl={avatarUrl} className="h-10 w-10 text-sm" /><div className="min-w-0"><p className="truncate font-semibold text-ink">{name}</p><p className="truncate text-xs text-slate-500">Estate neighbour</p></div></div>{listingId ? <Link href={`/listings/${listingId}`} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-adire hover:bg-[#EFE7D6]">Listing</Link> : <span className="w-14" />}</header>;
}
