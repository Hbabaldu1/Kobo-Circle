import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email and a password with at least 8 characters and one number.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
