import { notFound, redirect } from 'next/navigation';
import { ListingPhoto } from '@/components/listing-photo';
import { TrustRing } from '@/components/feed-list';
import { WhatsAppShareButton } from '@/components/whatsapp-share-button';
import { MessageSellerButton } from '@/components/message-seller-button';
import { DeleteListingButton } from '@/components/delete-listing-button';
import { Pencil } from 'lucide-react';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { buildWhatsAppListingLink } from '@/lib/whatsapp';

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  // RLS on listings ensures this query cannot return a cross-LGA listing.
  const { data: listing } = await supabase.from('listings').select('id, user_id, type, title, price, description, status, created_at, photo_url').eq('id', params.id).maybeSingle();
  if (!listing) notFound();
  const { data: seller } = await supabase.from('users').select('name, phone, avatar_url, ward_id').eq('id', listing.user_id).maybeSingle();
  if (!seller) notFound();
  const { data: ward } = seller.ward_id ? await supabase.from('wards').select('name, lga_id').eq('id', seller.ward_id).maybeSingle() : { data: null };
  const { data: lga } = ward ? await supabase.from('lgas').select('name').eq('id', ward.lga_id).maybeSingle() : { data: null };
  const typeLabel = listing.type === 'sale' ? 'For sale' : listing.type === 'service' ? 'Service' : 'Request';
  const phone = seller.phone?.trim() || undefined;
  const whatsappLink = buildWhatsAppListingLink(phone, listing.title) ?? undefined;
  const trustPercentage = 0;

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 py-10">
      <a href="/feed" className="text-sm font-semibold text-adire">← Back to feed</a>
      <article className="relative mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        {listing.user_id === user.id && <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg bg-white/95 p-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/95"><a href={`/listings/${listing.id}/edit`} aria-label="Edit listing" title="Edit listing" className="rounded-md p-2 text-adire transition-colors hover:bg-slate-100"><Pencil className="h-4 w-4" /></a><DeleteListingButton listingId={listing.id} redirectTo="feed" compact /></div>}
        <ListingPhoto photoUrl={listing.photo_url} type={listing.type} title={listing.title} />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-brick">{typeLabel}</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-ink">{listing.title}</h1>
        <p className="mt-2 text-lg font-semibold text-adire">{listing.type === 'request' || !listing.price ? 'Looking to buy' : listing.price}</p>
        {listing.description && <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">{listing.description}</p>}
        <div className="mt-6 flex items-center gap-3 border-t border-[#EFE7D6] pt-4">
          <TrustRing id={listing.user_id} name={seller.name} avatarUrl={seller.avatar_url ?? undefined} percentage={trustPercentage} />
          <div>
            <a href={`/sellers/${listing.user_id}`} className="font-semibold text-ink hover:underline">{seller.name}</a>
            <p className="text-sm text-slate-600">{ward ? `${ward.name}, ${lga?.name ?? 'Local Government'}` : 'Local neighbour'}</p>
            {phone ? <p className="mt-1 text-sm text-slate-700">{phone}</p> : <p className="mt-1 text-sm text-slate-500">This seller hasn&apos;t provided a phone number.</p>}
          </div>
        </div>
        {phone && whatsappLink && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <a href={`tel:${phone}`} className="inline-flex items-center justify-center rounded-lg border border-adire px-4 py-3 font-semibold text-adire transition-transform duration-100 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100">Call</a>
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg bg-[#25D366] px-4 py-3 font-semibold text-white transition-transform duration-100 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100">Message on WhatsApp</a>
          </div>
        )}
        {listing.user_id !== user.id && <MessageSellerButton listingId={listing.id} sellerId={listing.user_id} />}
        <WhatsAppShareButton id={listing.id} title={listing.title} price={listing.price} className="mt-5" />
      </article>
    </main>
  );
}
