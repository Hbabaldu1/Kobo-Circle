'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  useEffect(() => {
    const stored = document.cookie.match(/(?:^|; )kobo-theme=([^;]+)/)?.[1] as Theme | undefined;
    const initial = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    setTheme(initial); applyTheme(initial);
  }, []);
  function toggle() {
    const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    document.cookie = `kobo-theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setTheme(next); applyTheme(next);
  }
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return <button type="button" onClick={toggle} className="kobo-button-secondary inline-flex items-center gap-2" aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}><>{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</> {isDark ? 'Light theme' : 'Dark theme'}</button>;
}
