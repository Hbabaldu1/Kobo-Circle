import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

const PUBLIC_PATHS = new Set(['/', '/login', '/signup', '/check-email', '/auth/callback']);
const SUPABASE_TIMEOUT_MS = 3_500;
type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Edge middleware must complete promptly: a slow upstream Supabase request would
 * otherwise consume Vercel's entire middleware invocation budget.
 */
async function withSupabaseTimeout<T>(operation: string, requestId: string, promise: PromiseLike<T>): Promise<T | undefined> {
  const startedAt = Date.now();
  console.error(`[middleware][${requestId}] ${operation}: started`);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timeoutId = setTimeout(() => resolve(undefined), SUPABASE_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([Promise.resolve(promise), timeout]);
    const elapsedMs = Date.now() - startedAt;
    if (result === undefined) {
      console.error(`[middleware][${requestId}] ${operation}: timed out after ${elapsedMs}ms`);
    } else {
      console.error(`[middleware][${requestId}] ${operation}: completed in ${elapsedMs}ms`);
    }
    return result;
  } catch (error) {
    console.error(`[middleware][${requestId}] ${operation}: failed in ${Date.now() - startedAt}ms`, error);
    return undefined;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) return NextResponse.next();

  const requestId = crypto.randomUUID();
  const isPublicPath = PUBLIC_PATHS.has(request.nextUrl.pathname);
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

  const userResult = await withSupabaseTimeout('auth.getUser', requestId, supabase.auth.getUser());
  if (!userResult) {
    console.error(`[middleware][${requestId}] unable to verify session; applying safe fallback`);
    if (isPublicPath) return response;
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { data: { user } } = userResult;
  if (!user || !user.email_confirmed_at) {
    if (isPublicPath) return response;
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const profileResult = await withSupabaseTimeout(
    'users.profileExists',
    requestId,
    supabase.from('users').select('id').eq('id', user.id).maybeSingle(),
  );
  if (!profileResult) {
    console.error(`[middleware][${requestId}] unable to verify profile; applying safe fallback`);
    if (isPublicPath) return response;
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { data: profile } = profileResult;
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
