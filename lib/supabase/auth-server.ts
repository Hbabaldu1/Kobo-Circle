import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Creates the cookie-backed client recommended for App Router server code. */
export function createAuthServerClient(): SupabaseClient<Database, 'public'> {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Supabase public environment variables are missing.');

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(values: CookieToSet[]) {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; middleware refreshes sessions instead.
        }
      },
    },
  }) as unknown as SupabaseClient<Database, 'public'>;
}
