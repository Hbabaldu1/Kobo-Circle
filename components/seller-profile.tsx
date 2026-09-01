'use client';

import { useCallback, useState } from 'react';
import { TrustRing } from '@/components/feed-list';
import { UserAvatar } from '@/components/user-avatar';
import { VouchButton } from '@/components/vouch-button';
import { buildWhatsAppListingLink } from '@/lib/whatsapp';
import { logout } from '@/app/logout/actions';
import { MessageSellerButton } from '@/components/message-seller-button';

function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-ink transition-transform duration-100 hover:bg-white active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        Log out
      </button>
    </form>
  );
}

export function SellerProfile({
  sellerId,
  name,
  wardLgaName,
  initialVouchCounts,
  initialTrustRatio,
  notes,
  isOwner,
  phone,
  avatarUrl,
  listingTitle,
  currentUserId,
  memberSince,
}: {
  sellerId: string;
  name: string;
  wardLgaName: string;
  initialVouchCounts: { community: number; tenure: number; transaction: number };
  initialTrustRatio: number;
  phone: string | null;
  avatarUrl?: string;
  listingTitle?: string;
  notes: Array<{ id: string; note: string | null; created_at: string; voucherId: string; voucherName?: string; voucherAvatarUrl?: string }>;
  isOwner: boolean;
  currentUserId?: string;
  memberSince: string;
}) {
  const [vouchCounts, setVouchCounts] = useState(initialVouchCounts);
  const [trustRatio, setTrustRatio] = useState(initialTrustRatio);
  const [justVouched, setJustVouched] = useState(false);

  const handleVouched = useCallback((type: keyof typeof vouchCounts) => {
    setVouchCounts((counts) => ({ ...counts, [type]: counts[type] + 1 }));
    const weight = type === 'community' ? 1 : type === 'tenure' ? 2 : 3;
    setTrustRatio((ratio) => Math.min(ratio + weight / 24, 1));
    setJustVouched(true);
    window.setTimeout(() => setJustVouched(false), 180);
  }, []);

  const percentage = trustRatio * 100;
  const vouchCount = vouchCounts.community + vouchCounts.tenure + vouchCounts.transaction;
  const whatsappLink = listingTitle ? buildWhatsAppListingLink(phone, listingTitle) : null;
  const memberSinceLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(memberSince));

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 py-10">
      <div className="flex items-center justify-between">
        <a href="/feed" className="text-sm font-semibold text-adire">
          ← Back to feed
        </a>
        {isOwner && <LogoutButton />}
      </div>

      <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-4">
          <TrustRing id={sellerId} name={name} avatarUrl={avatarUrl} percentage={percentage} animate={justVouched} currentUserId={currentUserId} />
          <div>
            <h1 className="font-heading text-2xl font-bold text-ink">{name}</h1>
            <p className="text-sm text-slate-600">{wardLgaName}</p>
          </div>
          <span className="ml-auto font-mono text-lg font-bold text-adire">
            {Math.round(percentage)}%
          </span>
        </div>
        <p className="mt-4 inline-flex rounded-full bg-paper px-3 py-1 text-sm font-semibold text-ink">Member since {memberSinceLabel}</p>
        <p className="mt-3 text-sm text-slate-600">
          {vouchCount} {vouchCount === 1 ? 'vouch' : 'vouches'} from neighbours
        </p>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-paper p-2"><dt className="text-slate-500">Community</dt><dd className="mt-1 font-bold text-ink">{vouchCounts.community}</dd></div>
          <div className="rounded-lg bg-paper p-2"><dt className="text-slate-500">Tenure</dt><dd className="mt-1 font-bold text-ink">{vouchCounts.tenure}</dd></div>
          <div className="rounded-lg bg-paper p-2"><dt className="text-slate-500">Transaction</dt><dd className="mt-1 font-bold text-ink">{vouchCounts.transaction}</dd></div>
        </dl>
        {whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#25D366] px-4 py-3 font-semibold text-white"
          >
            Message on WhatsApp
          </a>
        ) : (
          <p className="mt-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-500">
            This neighbour hasn&apos;t shared a phone number yet
          </p>
        )}
        {!isOwner && <><MessageSellerButton sellerId={sellerId} /><VouchButton sellerId={sellerId} onVouched={handleVouched} /></>}
      </section>

      <section className="mt-6">
        <h2 className="font-heading text-xl font-bold text-ink">Vouch notes</h2>
        {notes.length ? (
          <ul className="mt-3 space-y-3">
            {notes.map((vouch) => (
              <li
                key={vouch.id}
                className="flex items-start gap-3 rounded-xl bg-white p-4 text-sm text-ink shadow-sm ring-1 ring-slate-200"
              >
                <UserAvatar id={vouch.voucherId} name={vouch.voucherName ?? 'Neighbour'} avatarUrl={vouch.voucherAvatarUrl} className="h-8 w-8 text-sm" />
                <div><p>{vouch.note || 'A neighbour vouched for this seller.'}</p><p className="mt-1 text-xs text-slate-500">{vouch.voucherName ?? 'Neighbour'}</p></div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200">
            No vouch notes yet.
          </p>
        )}
      </section>
    </main>
  );
}
