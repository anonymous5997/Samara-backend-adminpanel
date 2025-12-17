import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { killAllUserSessions } from '@/lib/auth/session-manager';

export const dynamic = 'force-dynamic';

/**
 * Firebase Phone OTP → Supabase Auth Bridge
 *
 * ARCHITECTURE:
 * 1. Firebase verifies phone OTP (already done client-side via Firebase Auth)
 * 2. Client sends Firebase ID token to this endpoint
 * 3. Server verifies Firebase token
 * 4. Server creates/updates Supabase Auth user
 * 5. Server creates fresh session (kills existing ones)
 * 6. Server ensures profile exists
 * 7. Returns Supabase session to client
 *
 * CRITICAL: This is the ONLY way phone users get Supabase sessions
 */

export async function POST(req: Request) {
  try {
    const { firebaseToken, phone, name } = await req.json();

    if (!firebaseToken || !phone) {
      return NextResponse.json(
        { error: 'Firebase token and phone are required' },
        { status: 400 }
      );
    }

    // Verify Firebase token
    let firebaseUser;
    try {
      const admin = await import('firebase-admin');
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID!,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
            privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
          }),
        });
      }

      firebaseUser = await admin.auth().verifyIdToken(firebaseToken);
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid Firebase token' },
        { status: 401 }
      );
    }

    // Check if phone matches
    if (firebaseUser.phone_number !== phone) {
      return NextResponse.json(
        { error: 'Phone number mismatch' },
        { status: 400 }
      );
    }

    console.log(`[Phone Bridge] Firebase user verified: ${firebaseUser.uid}`);

    // Check if Supabase user exists with this phone
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let supabaseUser = existingUsers?.users.find(u => u.phone === phone);

    if (!supabaseUser) {
      // Create new Supabase user
      console.log(`[Phone Bridge] Creating new Supabase user for phone: ${phone}`);

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        phone,
        phone_confirm: true,
        user_metadata: {
          name: name || '',
          auth_provider: 'phone',
        },
      });

      if (error) {
        console.error('Failed to create Supabase user:', error);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      supabaseUser = data.user;
      console.log(`[Phone Bridge] Created Supabase user: ${supabaseUser.id}`);
    } else {
      console.log(`[Phone Bridge] Found existing Supabase user: ${supabaseUser.id}`);
    }

    // Kill existing sessions
    await killAllUserSessions(supabaseUser.id);

    // Ensure profile exists
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (!profile) {
      await supabaseAdmin.from('profiles').insert({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        phone: phone,
        name: name || '',
        role: 'customer',
      });

      console.log(`[Phone Bridge] Created profile for user: ${supabaseUser.id}`);
    }

    // Generate OTP for sign-in (client will verify)
    const { data: otpData, error: otpError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: supabaseUser.email || `${phone}@phone.local`,
      options: {
        redirectTo: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      },
    });

    if (otpError) {
      console.error('Error generating sign-in link:', otpError);
      return NextResponse.json(
        { error: 'Failed to generate sign-in credentials' },
        { status: 500 }
      );
    }

    // Return user data and hashed token for client to create session
    return NextResponse.json({
      success: true,
      user: supabaseUser,
      token: otpData.properties?.hashed_token,
    });
  } catch (error) {
    console.error('Fatal error in phone-to-supabase bridge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
