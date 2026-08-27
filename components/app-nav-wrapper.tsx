'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { TopNav } from '@/components/top-nav';

const publicRoutes = ['/login', '/signup', '/onboarding', '/auth'];

export function AppNavWrapper({ children, initialAuthenticated }: { children: React.ReactNode; initialAuthenticated: boolean }) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  useEffect(() => {
    if (isPublicRoute) { setAuthenticated(false); return; }
    setAuthenticated(initialAuthenticated);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setAuthenticated(Boolean(session?.user)));
    return () => subscription.unsubscribe();
  }, [initialAuthenticated, isPublicRoute, supabase]);

  if (isPublicRoute || !authenticated) return <>{children}</>;
  return <><div className="hidden md:block"><TopNav /></div><div className="pb-20 md:pb-0">{children}</div><MobileBottomNav /></>;
}
