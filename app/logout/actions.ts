'use server';

import { redirect } from 'next/navigation';
import { createAuthServerClient } from '@/lib/supabase/auth-server';

export async function logout() {
  try {
    const supabase = createAuthServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign-out failed:', error.message);
    }
  } catch (err) {
    console.error('Unexpected error during sign-out:', err);
  }
  // Redirect regardless of whether signOut() reported an error — if the
  // session cookie genuinely failed to clear, middleware will catch it
  // on the next request and bounce back to /login anyway, since a stale
  // or invalid session fails getUser() the same way a missing one does.
  redirect('/login');
}
