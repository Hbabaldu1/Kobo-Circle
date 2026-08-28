// components/app-nav-wrapper.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { TopNav } from '@/components/top-nav';

const publicRoutes = ['/', '/login', '/signup', '/check-email', '/onboarding', '/auth'];

interface AppNavWrapperProps {
  children: React.ReactNode;
  initialAuthenticated?: boolean;
}

export function AppNavWrapper({ children, initialAuthenticated = false }: AppNavWrapperProps) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isDirectChat = pathname.startsWith('/messages/') && pathname !== '/messages';

  useEffect(() => {
    setAuthenticated(initialAuthenticated);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, [initialAuthenticated, isPublicRoute, supabase]);

  if (isPublicRoute || !authenticated) return <>{children}</>;

  return (
    <>
      <TopNav />
      {/* Remove pb-20 on direct chat pages so the view lock stays exact */}
      <div className={isDirectChat ? 'h-full' : 'pb-20 md:pb-0'}>{children}</div>
      <MobileBottomNav />
    </>
  );
}
