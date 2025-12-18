'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * Production Auth Context
 *
 * CRITICAL RULES:
 * 1. Profile role is the source of truth for authorization
 * 2. Never trust client-side role checks alone
 * 3. Always fetch fresh profile data after sign-in
 * 4. Session is killed server-side before new login
 * 5. Skip profile operations on /auth/* routes to prevent loops
 */

type Profile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  ensureProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  ensureProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileEnsuredRef = useRef(false);
  const isFetchingProfile = useRef(false);

  // Check if we're on an auth route
  const isAuthRoute = pathname?.startsWith('/auth');

  const fetchProfile = useCallback(async (userId: string, skipIfAuthRoute = true) => {
    // Skip if on auth route to prevent infinite loops
    if (skipIfAuthRoute && isAuthRoute) {
      console.log('[AuthContext] Skipping profile fetch on auth route');
      return false;
    }

    // Prevent concurrent fetches
    if (isFetchingProfile.current) {
      console.log('[AuthContext] Profile fetch already in progress');
      return false;
    }

    isFetchingProfile.current = true;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthContext] Error fetching profile:', error);
        setProfile(null);
        return false;
      }

      setProfile(data);
      console.log('[AuthContext] Profile loaded:', data?.role);
      return !!data;
    } catch (error) {
      console.error('[AuthContext] Fatal error fetching profile:', error);
      setProfile(null);
      return false;
    } finally {
      isFetchingProfile.current = false;
    }
  }, [isAuthRoute]);

  const ensureProfile = useCallback(async () => {
    if (!user) return;
    if (isAuthRoute) {
      console.log('[AuthContext] Skipping profile ensure on auth route');
      return;
    }
    if (profileEnsuredRef.current) {
      console.log('[AuthContext] Profile already ensured, skipping');
      return;
    }

    profileEnsuredRef.current = true;

    try {
      const response = await fetch('/api/profile/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.user_metadata?.name || '',
        }),
      });

      if (!response.ok) {
        console.error('[AuthContext] Failed to ensure profile');
        profileEnsuredRef.current = false;
        return;
      }

      // Refresh profile after ensuring it exists
      await fetchProfile(user.id, false);
    } catch (error) {
      console.error('[AuthContext] Error ensuring profile:', error);
      profileEnsuredRef.current = false;
    }
  }, [user, fetchProfile, isAuthRoute]);

  const refreshProfile = useCallback(async () => {
    if (user && !isAuthRoute) {
      await fetchProfile(user.id, false);
    }
  }, [user, fetchProfile, isAuthRoute]);

  useEffect(() => {
    // Skip profile operations on auth routes
    if (isAuthRoute) {
      console.log('[AuthContext] On auth route, setting loading to false');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data, error }) => {
      console.log('[AuthContext] Initial session check:', {
        hasSession: !!data.session,
        user: data.session?.user?.email,
        error: error?.message,
      });

      if (data.session?.user) {
        setUser(data.session.user);
        await fetchProfile(data.session.user.id, false);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth event:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);

          // Only fetch profile and ensure it exists if not on auth route
          if (!isAuthRoute) {
            const profileFetched = await fetchProfile(session.user.id, false);

            // If profile doesn't exist, try to create it (only once)
            if (!profileFetched && !profileEnsuredRef.current) {
              console.log('[AuthContext] Profile not found, ensuring it exists');
              setTimeout(() => ensureProfile(), 100);
            }
          } else {
            // On auth route, the login page will handle redirect
            console.log('[AuthContext] SIGNED_IN on auth route, skipping profile operations');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          profileEnsuredRef.current = false;
        } else if (event === 'USER_UPDATED' && session?.user) {
          setUser(session.user);
          if (!isAuthRoute) {
            await fetchProfile(session.user.id, false);
          }
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [isAuthRoute, fetchProfile]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        signOut,
        refreshProfile,
        ensureProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
