'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

/* ======================================================
   TYPES
====================================================== */

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

/* ======================================================
   CONTEXT
====================================================== */

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  ensureProfile: async () => {},
});

/* ======================================================
   PROVIDER
====================================================== */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Guards
  const isFetchingProfile = useRef(false);
  const profileEnsuredRef = useRef(false);
  const hasInitializedSession = useRef(false);

  const isAuthRoute = pathname?.startsWith('/auth');

  /* ======================================================
     FETCH PROFILE
  ===================================================== */

  const fetchProfile = useCallback(
    async (userId: string, skipIfAuthRoute = true) => {
      if (skipIfAuthRoute && isAuthRoute) return false;
      if (isFetchingProfile.current) return false;

      isFetchingProfile.current = true;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          setProfile(null);
          return false;
        }

        setProfile(data);
        return !!data;
      } finally {
        isFetchingProfile.current = false;
      }
    },
    [isAuthRoute]
  );

  /* ======================================================
     ENSURE PROFILE
  ===================================================== */

  const ensureProfile = useCallback(async () => {
    if (!user || isAuthRoute) return;
    if (profileEnsuredRef.current) return;

    profileEnsuredRef.current = true;

    try {
      const res = await fetch('/api/profile/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.user_metadata?.name || '',
        }),
      });

      if (res.ok) {
        await fetchProfile(user.id, false);
      } else {
        profileEnsuredRef.current = false;
      }
    } catch {
      profileEnsuredRef.current = false;
    }
  }, [user, fetchProfile, isAuthRoute]);

  /* ======================================================
     REFRESH PROFILE
  ===================================================== */

  const refreshProfile = useCallback(async () => {
    if (user && !isAuthRoute) {
      await fetchProfile(user.id, false);
    }
  }, [user, fetchProfile, isAuthRoute]);

  /* ======================================================
     SESSION INIT + LISTENER
  ===================================================== */

  useEffect(() => {
    if (isAuthRoute) {
      setLoading(false);
      return;
    }

    // 🔹 Initial session (RUNS ONCE)
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (hasInitializedSession.current) return;
        hasInitializedSession.current = true;

        if (!data.session?.user) {
          setLoading(false);
          return;
        }

        setUser(data.session.user);
        await fetchProfile(data.session.user.id, false);
        setLoading(false);
      });

    // 🔹 Auth state listener
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(prev =>
            prev?.id === session.user.id ? prev : session.user
          );

          if (!isAuthRoute) {
            const ok = await fetchProfile(session.user.id, false);
            if (!ok && !profileEnsuredRef.current) {
              setTimeout(() => ensureProfile(), 100);
            }
          }

          setLoading(false);
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          profileEnsuredRef.current = false;
          hasInitializedSession.current = false;
          setLoading(false);
        }

        if (event === 'USER_UPDATED' && session?.user) {
          setUser(session.user);
          if (!isAuthRoute) {
            await fetchProfile(session.user.id, false);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [isAuthRoute, fetchProfile, ensureProfile]);

  /* ======================================================
     SIGN OUT
  ===================================================== */

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
    window.location.href = '/';
  };

  const isAdmin = profile?.role === 'admin';

  /* ======================================================
     PROVIDER VALUE
  ===================================================== */

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

/* ======================================================
   HOOK
====================================================== */

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
