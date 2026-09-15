'use client';

import { useEffect, useState } from 'react';
import { Wifi } from 'lucide-react';

export function OfflineNotifier() {
  const [isOnline, setIsOnline] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Set initial state from navigator
    setIsOnline(navigator.onLine);
    setIsMounted(true);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) return null;

  // Only show when offline
  if (isOnline) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'var(--paper)',
        backdropFilter: 'blur(0px)',
      }}
      role="status"
      aria-label="Offline status"
      aria-live="polite"
    >
      {/* Dark mode support */}
      <style>{`
        @media (prefers-color-scheme: dark) {
          .offline-notifier-bg {
            background-color: var(--paper);
          }
        }
      `}</style>

      <div className="flex flex-col items-center justify-center space-y-6 max-w-sm text-center">
        {/* Logo K mark */}
        <div
          className="offline-signal-icon"
          style={{
            fontSize: '3.5rem',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            viewBox="0 0 192 192"
            fill="none"
          >
            {/* Kobo Circle K mark - simplified */}
            <circle cx="96" cy="96" r="80" stroke="var(--ink)" strokeWidth="8" />
            <circle cx="96" cy="96" r="55" fill="var(--paper)" />
            <path
              d="M75 65 L96 85 L117 65 M96 85 L96 120 M75 120 L117 120"
              stroke="var(--adire)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Wi-Fi Icon with animation */}
        <div className="relative flex items-center justify-center">
          <style>{`
            @keyframes wifi-pulse {
              0%, 100% {
                opacity: 0.6;
              }
              50% {
                opacity: 1;
              }
            }

            @media (prefers-reduced-motion: no-preference) {
              .wifi-icon {
                animation: wifi-pulse 2s ease-in-out infinite;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .wifi-icon {
                opacity: 0.8;
                animation: none;
              }
            }
          `}</style>
          <div className="wifi-icon">
            <Wifi
              size={48}
              strokeWidth={1.5}
              style={{
                color: 'var(--ochre)',
              }}
            />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2
            className="text-2xl font-bold"
            style={{
              color: 'var(--ink)',
            }}
          >
            You're Offline
          </h2>
          <p
            className="text-base leading-relaxed"
            style={{
              color: 'var(--ink)',
              opacity: 0.75,
            }}
          >
            Check your internet connection. Kobo Circle will reconnect automatically when you're back online.
          </p>
        </div>

        {/* Subtle connection indicator */}
        <div
          className="mt-8 inline-block px-4 py-2 rounded-full text-sm font-medium"
          style={{
            backgroundColor: 'var(--adire)',
            color: 'var(--paper)',
          }}
        >
          Looking for connection...
        </div>
      </div>

      {/* Support for Capacitor Android shell */}
      <style>{`
        @media (display-mode: standalone) {
          .offline-notifier-bg {
            padding-top: max(0px, env(safe-area-inset-top));
            padding-bottom: max(0px, env(safe-area-inset-bottom));
            padding-left: max(0px, env(safe-area-inset-left));
            padding-right: max(0px, env(safe-area-inset-right));
          }
        }
      `}</style>
    </div>
  );
}
