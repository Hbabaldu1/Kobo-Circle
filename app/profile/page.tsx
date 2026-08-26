import { redirect } from 'next/navigation';
import { TrustRing } from '@/components/feed-list';
import { ProfileForm } from '@/components/profile-form';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export default async function MyProfilePage() {
  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) redirect('/login');

  const { data: profile } = await supabase.from('users').select('id, name, phone, street_id, estate_id').eq('id', user.id).maybeSingle();
  if (!profile) redirect('/onboarding');

  const [{ data: street }, { data: estate }, { data: trust }, { data: streets }] = await Promise.all([
    supabase.from('streets').select('name').eq('id', profile.street_id).maybeSingle(),
    supabase.from('estates').select('name').eq('id', profile.estate_id).maybeSingle(),
    supabase.from('seller_trust').select('vouch_count, trust_ratio').eq('user_id', user.id).maybeSingle(),
    supabase.from('streets').select('id, name').eq('estate_id', profile.estate_id).order('name'),
  ]);

  const percentage = Number(trust?.trust_ratio ?? 0) * 100;
  return <main className="mx-auto min-h-screen max-w-lg px-5 py-10"><a href="/feed" className="text-sm font-semibold text-adire">← Back to feed</a><section className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="flex items-center gap-4"><TrustRing id={profile.id} name={profile.name} percentage={percentage} /><div><h1 className="font-heading text-2xl font-bold text-ink">My Profile</h1><p className="text-sm text-slate-600">{profile.name}</p></div><span className="ml-auto font-mono text-lg font-bold text-adire">{Math.round(percentage)}%</span></div><dl className="mt-6 space-y-3 text-sm"><div><dt className="font-semibold text-ink">Street</dt><dd className="text-slate-600">{street?.name ?? 'Estate neighbour'}</dd></div><div><dt className="font-semibold text-ink">Estate</dt><dd className="text-slate-600">{estate?.name ?? 'Your estate'}</dd></div><div><dt className="font-semibold text-ink">Phone</dt><dd className="text-slate-600">{profile.phone || 'Not added'}</dd></div><div><dt className="font-semibold text-ink">Trust</dt><dd className="text-slate-600">{trust?.vouch_count ?? 0} {(trust?.vouch_count ?? 0) === 1 ? 'vouch' : 'vouches'} from neighbours</dd></div></dl><ProfileForm name={profile.name} phone={profile.phone} streetId={profile.street_id} streets={streets ?? []} /></section></main>;
}
