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
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-[#D4AF37] font-serif text-lg tracking-widest animate-pulse">
        SIGNING YOU IN...
      </div>
    </div>
  );
}