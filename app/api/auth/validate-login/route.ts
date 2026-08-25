import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email address and password.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
