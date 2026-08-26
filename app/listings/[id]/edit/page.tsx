import { notFound, redirect } from 'next/navigation';
import { EditListingForm } from '@/components/edit-listing-form';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: listing } = await supabase
    .from('listings')
    .select('id, user_id, type, title, price, description, status')
    .eq('id', params.id)
    .maybeSingle();

  if (!listing) notFound();
  if (listing.user_id !== user.id) notFound();

  return <main className="mx-auto min-h-screen max-w-lg px-5 py-10"><a href={`/listings/${listing.id}`} className="text-sm font-semibold text-adire">← Back to listing</a><h1 className="mt-4 font-heading text-3xl font-bold text-ink">Edit listing</h1><EditListingForm listing={listing} /></main>;
}
