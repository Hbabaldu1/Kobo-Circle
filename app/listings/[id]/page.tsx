import { notFound, redirect } from 'next/navigation';
import { WhatsAppShareButton } from '@/components/whatsapp-share-button';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  // RLS on listings ensures this query cannot return a cross-estate listing.
  const { data: listing } = await supabase.from('listings').select('id, user_id, type, title, price, description, created_at').eq('id', params.id).maybeSingle();
  if (!listing) notFound();
  const { data: seller } = await supabase.from('users').select('name, street_id').eq('id', listing.user_id).maybeSingle();
  if (!seller) notFound();
  const { data: street } = await supabase.from('streets').select('name').eq('id', seller.street_id).maybeSingle();
  const typeLabel = listing.type === 'sale' ? 'For sale' : listing.type === 'service' ? 'Service' : 'Request';
  return <main className="mx-auto min-h-screen max-w-lg px-5 py-10"><a href="/feed" className="text-sm font-semibold text-adire">← Back to feed</a><article className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brick">{typeLabel}</p><h1 className="mt-2 font-heading text-3xl font-bold text-ink">{listing.title}</h1><p className="mt-2 text-lg font-semibold text-adire">{listing.type === 'request' || !listing.price ? 'Looking to buy' : listing.price}</p>{listing.description && <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">{listing.description}</p>}<div className="mt-6 border-t border-[#EFE7D6] pt-4"><a href={`/sellers/${listing.user_id}`} className="font-semibold text-ink">{seller.name}</a><p className="text-sm text-slate-600">{street?.name}</p></div>{listing.user_id === user.id && <WhatsAppShareButton id={listing.id} title={listing.title} price={listing.price} className="mt-5" />}</article></main>;
}
