'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // ❌ REMOVED: manual supabase.auth.exchangeCodeForSession()
    // This was causing the "PKCE code verifier not found" error because
    // Supabase's client library automatically detects the OAuth code/tokens
    // in the URL and handles the handshake internally.
    
    // We simply redirect to the intended page (Home or Profile).
    // The AuthProvider will pick up the new session state automatically.
    router.replace('/');
  }, [router]);

  return (
    <div className="flex min-h-[calc(100svh-var(--sm-header-h))] items-center justify-center bg-samara-black px-[var(--sm-gutter)]">
      <div role="status" className="flex flex-col items-center text-center">
        <span aria-hidden className="font-serif text-7xl font-light italic leading-none text-samara-gold/40">
          S
        </span>
        <span aria-hidden className="mt-8 block h-px w-24 overflow-hidden bg-samara-line">
          <span className="block h-full w-full origin-left bg-samara-gold motion-safe:animate-pulse" />
        </span>
        <p className="mt-8 font-serif text-2xl font-light text-samara-ivory">
          Signing you <span className="sm-accent">in…</span>
        </p>
      </div>
    </div>
  );
}