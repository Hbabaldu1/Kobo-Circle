'use client';

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

type UpdateManifest = {
  latestNativeVersion: string;
  downloadUrl: string;
  releaseNotes?: string;
};

const MANIFEST_URL = 'https://kobo-circle.vercel.app/update-manifest.json';
const PRODUCTION_HOST = 'kobo-circle.vercel.app';

function isNewerVersion(installed: string, latest: string) {
  const parse = (version: string) => version.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const installedParts = parse(installed);
  const latestParts = parse(latest);
  const length = Math.max(installedParts.length, latestParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (latestParts[index] ?? 0) - (installedParts[index] ?? 0);
    if (difference !== 0) return difference > 0;
  }
  return false;
}

/**
 * This deliberately checks native-shell releases only: plugin, permission, and
 * branding changes. Regular Kobo Circle web deployments already reach the live
 * site inside the WebView and do not need an APK update or version bump.
 */
export function NativeShellUpdate() {
  const [update, setUpdate] = useState<UpdateManifest | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void (async () => {
      try {
        const [appInfo, response] = await Promise.all([
          App.getInfo(),
          fetch(MANIFEST_URL, { cache: 'no-store' }),
        ]);
        if (!response.ok) return;

        const manifest = (await response.json()) as UpdateManifest;
        const url = new URL(manifest.downloadUrl);
        if (
          url.protocol !== 'https:' ||
          url.hostname !== PRODUCTION_HOST ||
          !manifest.latestNativeVersion ||
          !isNewerVersion(appInfo.version, manifest.latestNativeVersion)
        ) return;

        setUpdate(manifest);
      } catch {
        // The update check is non-blocking; networking must never affect app use.
      }
    })();
  }, []);

  if (!update) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-lg rounded-xl bg-ink p-4 text-white shadow-xl" aria-label="Native app update available">
      <button type="button" aria-label="Dismiss update notice" onClick={() => setUpdate(null)} className="absolute right-3 top-2 text-xl leading-none text-white/80 hover:text-white">×</button>
      <p className="pr-6 font-semibold">A new version of Kobo Circle is available</p>
      {update.releaseNotes ? <p className="mt-1 text-sm text-white/80">{update.releaseNotes}</p> : null}
      <a href={update.downloadUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-lg bg-ochre px-3 py-2 text-sm font-semibold text-ink">Download update</a>
    </aside>
  );
}
