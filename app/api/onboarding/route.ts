import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { userProfileSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const parsed = userProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Check your name and choose a street.' }, { status: 400 });

  const supabase = createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at || !user.email) return NextResponse.json({ error: 'Confirm your email and sign in again.' }, { status: 401 });

  const { data: street } = await supabase
    .from('streets')
    .select('id, estate_id')
    .eq('id', parsed.data.streetId)
    .maybeSingle();
  const { data: expectedEstate } = await supabase.from('estates').select('id').limit(1).maybeSingle();
  if (!street || !expectedEstate || street.estate_id !== expectedEstate.id) {
    return NextResponse.json({ error: 'That street is unavailable. Please choose another one.' }, { status: 400 });
  }

  const { error } = await supabase.from('users').insert({
    id: user.id,
    name: parsed.data.name,
    email: user.email,
    phone: parsed.data.phone,
    street_id: street.id,
    estate_id: street.estate_id,
  });
  if (error) return NextResponse.json({ error: 'We could not save your estate details. Please try again.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
