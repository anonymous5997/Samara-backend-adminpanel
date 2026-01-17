'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

/* ---------------- TYPES ---------------- */

type Profile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'customer' | 'admin';
  house?: string;
  building?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pin?: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null; // ✅ Added Session type
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

/* ---------------- CONTEXT ---------------- */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ---------------- PROVIDER ---------------- */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null); // ✅ Added Session state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- PROFILE LOADER ---------------- */
  const loadProfile = async (authUser: User) => {
    // 1️⃣ Try fetching existing profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existingProfile) {
      setProfile(existingProfile);
      return;
    }

    // 2️⃣ Create profile if missing
    // We strictly use insert here (not upsert) to avoid overwriting name
    await supabase.from('profiles').insert({
      id: authUser.id,
      email: authUser.email!,
      role: 'customer',
    });

    // 3️⃣ Fetch the newly created profile
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    setProfile(data);
  };

  /* ---------------- AUTH HYDRATION ---------------- */
  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      // ✅ STEP 1: Guard exchangeCodeForSession (Performance Fix)
      // Only parse URL if it actually looks like an auth callback
      const hasAuthCode =
        window.location.search.includes('code=') ||
        window.location.hash.includes('access_token');

      if (hasAuthCode) {
        await supabase.auth.exchangeCodeForSession(window.location.href);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      // ✅ Track Session
      setSession(session);

      if (session?.user) {
        setUser(session.user);
        // ✅ STEP 2: Non-blocking profile load (UI renders faster)
        loadProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }

      // ✅ FIX: Only update loading if it was true (Prevents extra re-render)
      setLoading((prev) => (prev ? false : prev));
    };

    hydrate();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      // ✅ Track Session
      setSession(session);

      if (session?.user) {
        setUser(session.user);
        // ✅ STEP 2: Non-blocking profile load
        loadProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }

      // ✅ FIX: Only update loading if it was true (Prevents extra re-render)
      setLoading((prev) => (prev ? false : prev));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* ---------------- HELPERS ---------------- */

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null); // ✅ Clear session
    setProfile(null);
    window.location.href = '/';
  };

  /* ---------------- PROVIDER ---------------- */

  return (
    <AuthContext.Provider
      value={{
        user,
        session, // ✅ Expose session
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ---------------- HOOK ---------------- */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}