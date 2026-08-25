import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

const PUBLIC_PATHS = new Set(['/login', '/onboarding']);
type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isPublicPath = PUBLIC_PATHS.has(request.nextUrl.pathname);
  if (!user) {
    if (isPublicPath) return response;
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { data: profile } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle();
  if (!profile) {
    if (request.nextUrl.pathname === '/onboarding') return response;
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  if (isPublicPath) return NextResponse.redirect(new URL('/feed', request.url));
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)'],
};
