import { redirect } from 'next/navigation';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { ProfileAvatarUploader } from '@/components/profile-avatar-uploader';
import { LogoutButton } from '@/components/logout-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { EditPhoneForm } from '@/components/edit-phone-form';

export default async function ProfilePage() {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('users').select('id,name,phone,avatar_url,state_id,lga_id,ward_id,created_at').eq('id', user.id).maybeSingle();
  if (!profile) redirect('/onboarding');
  const [{ data: state }, { data: lga }, { data: ward }, { data: trust }, { data: listings }] = await Promise.all([
    supabase.from('states').select('name').eq('id', profile.state_id).maybeSingle(), supabase.from('lgas').select('name').eq('id', profile.lga_id).maybeSingle(), profile.ward_id ? supabase.from('wards').select('name').eq('id', profile.ward_id).maybeSingle() : Promise.resolve({ data: null }), supabase.from('seller_trust').select('vouch_count,trust_ratio').eq('user_id', user.id).maybeSingle(), supabase.from('listings').select('id,title,status').eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);
  const percentage = Math.round((trust?.trust_ratio ?? 0) * 100);
  return <main className="page-transition mx-auto min-h-screen max-w-lg px-5 py-10"><a href="/feed" className="text-sm font-semibold text-adire">← Back to feed</a>
    <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-bold uppercase tracking-[.16em] text-adire">Identity</p><div className="mt-4 flex items-center gap-4"><ProfileAvatarUploader id={profile.id} name={profile.name} avatarUrl={profile.avatar_url ?? undefined} percentage={percentage} /><div><h1 className="font-heading text-2xl font-bold text-ink">{profile.name}</h1><p className="text-sm text-slate-600">{ward?.name ?? lga?.name ?? 'Location not set'}, {state?.name ?? ''}</p></div></div></section>
    <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-bold uppercase tracking-[.16em] text-adire">Trust summary</p><div className="mt-3 flex items-end justify-between"><div><p className="font-heading text-3xl font-bold text-ink">{percentage}%</p><p className="text-sm text-slate-600">Community trust score</p></div><p className="text-sm font-semibold text-leaf">{trust?.vouch_count ?? 0} vouches</p></div><dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm"><div className="rounded-lg bg-paper p-3"><dt className="text-slate-500">Community</dt><dd className="mt-1 font-bold text-ink">{trust?.vouch_count ?? 0}</dd></div><div className="rounded-lg bg-paper p-3"><dt className="text-slate-500">Tenure</dt><dd className="mt-1 font-bold text-ink">Active</dd></div><div className="rounded-lg bg-paper p-3"><dt className="text-slate-500">Transactions</dt><dd className="mt-1 font-bold text-ink">{trust?.vouch_count ?? 0}</dd></div></dl></section>
    <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-bold uppercase tracking-[.16em] text-adire">My listings</p><p className="mt-2 text-sm text-slate-600">{listings?.length ?? 0} listing{listings?.length === 1 ? '' : 's'} posted.</p>{(listings ?? []).slice(0, 3).map((listing) => <a href={`/listings/${listing.id}`} key={listing.id} className="mt-3 block rounded-lg bg-paper p-3 text-sm font-semibold text-ink">{listing.title}<span className="ml-2 text-xs font-normal text-slate-500 capitalize">{listing.status}</span></a>)}</section>
    <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-bold uppercase tracking-[.16em] text-adire">Account actions</p><div className="mt-4"><EditPhoneForm phone={profile.phone} /></div><div className="mt-5"><ThemeToggle /></div><div className="mt-5"><LogoutButton /></div></section>
  </main>;
}
