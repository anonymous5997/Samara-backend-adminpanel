import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { firebaseToken } = await req.json();

    if (!firebaseToken) {
      return NextResponse.json(
        { error: 'Firebase token is required' },
        { status: 400 }
      );
    }

    let decodedToken;
    try {
      const adminAuth = getAdminAuth();
      decodedToken = await adminAuth.verifyIdToken(firebaseToken);
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid Firebase token' },
        { status: 401 }
      );
    }

    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number not found in token' },
        { status: 400 }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', phoneNumber)
      .maybeSingle();

    let userId: string;

    if (profile) {
      userId = profile.id;
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone: phoneNumber,
        phone_confirm: true,
        user_metadata: {
          phone_verified: true,
        },
      });

      if (createError) {
        console.error('Error creating Supabase user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      userId = newUser.user.id;

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          phone: phoneNumber,
          phone_verified: true,
          role: 'customer',
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }

    const tempPassword = `temp_${firebaseToken.substring(0, 32)}_${Date.now()}`;

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: tempPassword }
    );

    if (updateError) {
      console.error('Error setting temporary password:', updateError);
      return NextResponse.json(
        { error: 'Failed to prepare authentication' },
        { status: 500 }
      );
    }

    const fakeEmail = `${phoneNumber.replace(/\+/g, '').replace(/[^0-9]/g, '')}@phone.local`;

    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: fakeEmail,
      password: tempPassword,
    });

    if (signInError) {
      console.log('Email sign-in failed, trying with phone...');

      const { data: updateEmailResult, error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email: fakeEmail }
      );

      if (emailError) {
        console.error('Failed to set email:', emailError);
      }

      const { data: retrySignIn, error: retryError } = await supabaseAdmin.auth.signInWithPassword({
        email: fakeEmail,
        password: tempPassword,
      });

      if (retryError || !retrySignIn.session) {
        console.error('Retry sign-in failed:', retryError);
        return NextResponse.json({
          success: true,
          userId,
          tempPassword,
          email: fakeEmail,
        });
      }

      return NextResponse.json({
        success: true,
        userId,
        accessToken: retrySignIn.session.access_token,
        refreshToken: retrySignIn.session.refresh_token,
      });
    }

    if (!signInData.session) {
      return NextResponse.json({
        success: true,
        userId,
        tempPassword,
        email: fakeEmail,
      });
    }

    return NextResponse.json({
      success: true,
      userId,
      accessToken: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
    });
  } catch (error) {
    console.error('Phone sign-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
