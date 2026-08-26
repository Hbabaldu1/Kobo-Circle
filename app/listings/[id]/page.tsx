import { notFound, redirect } from 'next/navigation';
import { ListingPhoto } from '@/components/listing-photo';
import { ListingStatusButtons } from '@/components/listing-status-buttons';
import { TrustRing } from '@/components/feed-list';
import { WhatsAppShareButton } from '@/components/whatsapp-share-button';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { buildWhatsAppListingLink } from '@/lib/whatsapp';

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  // RLS on listings ensures this query cannot return a cross-estate listing.
  const { data: listing } = await supabase.from('listings').select('id, user_id, type, title, price, description, status, created_at, photo_url').eq('id', params.id).maybeSingle();
  if (!listing) notFound();
  const [{ data: seller }, { data: trust }] = await Promise.all([
    supabase.from('users').select('name, phone, street_id').eq('id', listing.user_id).maybeSingle(),
    supabase.from('seller_trust').select('trust_ratio').eq('user_id', listing.user_id).maybeSingle(),
  ]);
  if (!seller) notFound();
  const { data: street } = await supabase.from('streets').select('name').eq('id', seller.street_id).maybeSingle();
  const typeLabel = listing.type === 'sale' ? 'For sale' : listing.type === 'service' ? 'Service' : 'Request';
  const whatsappLink = buildWhatsAppListingLink(seller.phone, listing.title);
  const isOwner = listing.user_id === user.id;
  const percentage = Number(trust?.trust_ratio ?? 0) * 100;
  return <main className="mx-auto min-h-screen max-w-lg px-5 py-10"><a href="/feed" className="text-sm font-semibold text-adire">← Back to feed</a><article className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><ListingPhoto photoUrl={listing.photo_url} type={listing.type} title={listing.title} /><div className="mt-5 flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brick">{typeLabel}</p>{isOwner && <a href={`/listings/${listing.id}/edit`} className="rounded-lg border border-adire px-3 py-2 text-sm font-semibold text-adire transition-transform duration-100 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100">Edit</a>}</div><h1 className="mt-2 font-heading text-3xl font-bold text-ink">{listing.title}</h1><p className="mt-2 text-lg font-semibold text-adire">{listing.type === 'request' || !listing.price ? 'Looking to buy' : listing.price}</p>{listing.status !== 'active' && <p className="mt-3 inline-flex rounded-full bg-[#EFE7D6] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-ink">{listing.status}</p>}{listing.description && <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">{listing.description}</p>}<div className="mt-6 flex items-center gap-3 border-t border-[#EFE7D6] pt-4"><TrustRing id={listing.user_id} name={seller.name} percentage={percentage} /><a href={`/sellers/${listing.user_id}`} className="font-semibold text-ink"><span>{seller.name}</span><span className="block text-sm font-normal text-slate-600">{street?.name ?? 'Estate neighbour'}</span></a></div>{whatsappLink ? <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#25D366] px-4 py-3 font-semibold text-white transition-transform duration-100 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100">Message on WhatsApp</a> : <p className="mt-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-500">This neighbour hasn&apos;t shared a phone number yet</p>}{isOwner && <><ListingStatusButtons listingId={listing.id} status={listing.status} /><WhatsAppShareButton id={listing.id} title={listing.title} price={listing.price} className="mt-5" /></>}</article></main>;
}
