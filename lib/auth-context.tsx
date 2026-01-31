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
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
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
      // 🔁 Backfill missing name if metadata has it
      if (!existingProfile.name) {
        const nameFromProvider =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.user_metadata?.given_name ||
          null;

        if (nameFromProvider) {
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .update({ name: nameFromProvider })
            .eq('id', authUser.id)
            .select()
            .single();

          setProfile(updatedProfile);
          return;
        }
      }

      setProfile(existingProfile);
      return;
    }

    // ✅ Extract name from OAuth provider (Google, Facebook, etc.)
    const nameFromProvider =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.user_metadata?.given_name ||
      null;

    // 2️⃣ Create profile if missing (with name)
    // We strictly use insert here (not upsert) to avoid overwriting existing data accidentally
    await supabase.from('profiles').insert({
      id: authUser.id,
      email: authUser.email!,
      name: nameFromProvider, // ✅ SAVES GOOGLE NAME
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
    setSession(null);
    setProfile(null);
    window.location.href = '/';
  };

  /* ---------------- PROVIDER ---------------- */

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
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