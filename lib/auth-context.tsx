'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

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
      // 🔥 THIS IS THE FIX FOR OTP / MAGIC LINKS
      // This forces Supabase to parse the URL hash for tokens immediately
      await supabase.auth.exchangeCodeForSession(window.location.href);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    };

    hydrate();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
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
    setProfile(null);
    window.location.href = '/';
  };

  /* ---------------- PROVIDER ---------------- */

  return (
    <AuthContext.Provider
      value={{
        user,
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