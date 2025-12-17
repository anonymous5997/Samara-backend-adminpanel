import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Session Manager for Production Auth System
 *
 * CRITICAL RULES:
 * 1. Kill existing sessions before creating new ones
 * 2. One active session per browser/device
 * 3. Server-side only - NEVER expose to client
 * 4. Use service role key for session management
 */

/**
 * Kill all existing sessions for a user
 * MUST be called before creating a new session
 */
export async function killAllUserSessions(userId: string): Promise<void> {
  try {
    // Use admin client to sign out all sessions
    const { error } = await supabaseAdmin.auth.admin.signOut(userId, 'global');

    if (error) {
      console.error('Error killing user sessions:', error);
      throw new Error('Failed to kill existing sessions');
    }

    console.log(`[SessionManager] Killed all sessions for user: ${userId}`);
  } catch (error) {
    console.error('Fatal error in killAllUserSessions:', error);
    throw error;
  }
}

/**
 * Verify user session and return user data with role
 * MUST be used for all protected routes
 */
export async function verifySession() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Fetch profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name, phone, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      console.warn(`[SessionManager] No profile found for user: ${user.id}`);
      return null;
    }

    return {
      user,
      profile,
    };
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

/**
 * Check if user has admin role
 * MUST be called server-side for admin operations
 */
export async function isAdmin(): Promise<boolean> {
  const session = await verifySession();
  return session?.profile?.role === 'admin';
}

/**
 * Require admin role or throw error
 * Use this at the start of admin-only API routes
 */
export async function requireAdmin() {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error('Unauthorized: Admin access required');
  }

  return true;
}

/**
 * Require authentication or throw error
 * Use this at the start of protected API routes
 */
export async function requireAuth() {
  const session = await verifySession();

  if (!session) {
    throw new Error('Unauthorized: Authentication required');
  }

  return session;
}
