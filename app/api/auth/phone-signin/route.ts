import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { firebaseToken } = await req.json();

    if (!firebaseToken) {
      console.error('[Phone Sign-in] Missing Firebase token');
      return NextResponse.json({ error: 'Missing Firebase token' }, { status: 400 });
    }

    // Step 1: Verify Firebase ID token using Firebase Admin SDK
    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseToken);
      console.log('[Phone Sign-in] Firebase token verified for UID:', decoded.uid);
    } catch (verifyError: any) {
      console.error('[Phone Sign-in] Firebase token verification failed:', verifyError);
      return NextResponse.json(
        {
          error: 'Invalid Firebase token',
          details: verifyError.message,
        },
        { status: 401 }
      );
    }

    // Step 2: Extract phone number from decoded token
    const phone = decoded.phone_number;

    if (!phone) {
      console.error('[Phone Sign-in] Phone number not found in token');
      return NextResponse.json(
        { error: 'Phone number not found in Firebase token' },
        { status: 400 }
      );
    }

    console.log('[Phone Sign-in] Processing phone number:', phone);

    // Step 3: Find user in Supabase using phone number
    const { data: existingUsers, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();

    if (fetchError) {
      console.error('[Phone Sign-in] Error listing users:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    let supabaseUserId: string | null = null;
    const existingUser = existingUsers.users.find((u) => u.phone === phone);

    if (existingUser) {
      // User exists
      supabaseUserId = existingUser.id;
      console.log('[Phone Sign-in] Found existing user:', supabaseUserId);
    } else {
      // Step 4: Create new Supabase user if not exists
      console.log('[Phone Sign-in] Creating new user for phone:', phone);

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone,
        phone_confirm: true,
        user_metadata: {
          phone,
        },
      });

      if (createError || !newUser.user) {
        console.error('[Phone Sign-in] Error creating Supabase user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user account', details: createError?.message },
          { status: 500 }
        );
      }

      supabaseUserId = newUser.user.id;
      console.log('[Phone Sign-in] Created new user:', supabaseUserId);

      // Create profile row linked to user ID
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: supabaseUserId,
          phone,
          role: 'customer',
        });

      if (profileError) {
        console.error('[Phone Sign-in] Error creating profile:', profileError);
        // Continue even if profile creation fails - the auth user is created
      } else {
        console.log('[Phone Sign-in] Profile created successfully');
      }
    }

    // Step 5: Ensure user has an email for generateLink (required by Supabase)
    // This is NOT a fake email - it's a system email for phone-auth users
    const systemEmail = `${supabaseUserId}@phone.auth.supabase`;

    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);

    if (getUserError || !userData.user) {
      console.error('[Phone Sign-in] Error fetching user:', getUserError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    if (!userData.user.email) {
      console.log('[Phone Sign-in] Adding system email for phone-authenticated user');
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        supabaseUserId,
        { email: systemEmail }
      );

      if (updateError) {
        console.error('[Phone Sign-in] Error updating user with system email:', updateError);
      }
    }

    // Step 6: Create Supabase session using OFFICIAL method
    // Use recovery link to generate session tokens (works without password)
    console.log('[Phone Sign-in] Generating session tokens via recovery link');

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userData.user.email || systemEmail,
    });

    if (linkError || !linkData) {
      console.error('[Phone Sign-in] Error generating recovery link:', linkError);
      return NextResponse.json(
        { error: 'Failed to create session', details: linkError?.message },
        { status: 500 }
      );
    }

    // Extract tokens from the action link URL
    const actionLink = linkData.properties.action_link;
    const url = new URL(actionLink);
    const token = url.hash.substring(1); // Remove the # at the start
    const params = new URLSearchParams(token);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      console.error('[Phone Sign-in] Tokens not found in recovery link');
      return NextResponse.json(
        { error: 'Failed to extract session tokens' },
        { status: 500 }
      );
    }

    console.log('[Phone Sign-in] Successfully generated session tokens');

    // Step 7: Return tokens to frontend
    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      userId: supabaseUserId,
    });

  } catch (err: any) {
    console.error('[Phone Sign-in] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
