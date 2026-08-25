import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

function requireServerEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

/** Server-only client for trusted backend operations. Never import in client components. */
export function createServerSupabaseClient() {
  const environment = requireServerEnvironment();
  if (!environment) return null;

  return createClient<Database>(environment.url, environment.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
