import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { firebaseToken } = await req.json();

    if (!firebaseToken) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    let decoded;
    try {
      decoded = await verifyFirebaseToken(firebaseToken);
    } catch (verifyError: any) {
      console.error('Firebase token verification failed:', verifyError);
      return NextResponse.json(
        {
          error: "Invalid Firebase token",
          details: verifyError.message,
          code: verifyError.code
        },
        { status: 401 }
      );
    }

    const firebase_uid = decoded.uid;
    const phone = decoded.phone_number;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number not found in token" },
        { status: 400 }
      );
    }

    let { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("firebase_uid", firebase_uid)
      .maybeSingle();

    let supabaseUser;

    if (existingProfile) {
      supabaseUser = await supabaseAdmin.auth.admin.getUserById(existingProfile.id);
      if (supabaseUser.error) {
        console.error('Error fetching existing user:', supabaseUser.error);
        return NextResponse.json(
          { error: "Failed to fetch user" },
          { status: 500 }
        );
      }
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone,
        phone_confirm: true,
        user_metadata: {
          firebase_uid,
        },
      });

      if (createError) {
        console.error('Error creating Supabase user:', createError);
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 }
        );
      }

      supabaseUser = { data: { user: newUser.user } };

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: newUser.user.id,
          firebase_uid,
          phone,
          role: 'customer'
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }

    const tempPassword = `temp_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    const fakeEmail = `${phone.replace(/\+/g, '').replace(/[^0-9]/g, '')}@phone.local`;

    await supabaseAdmin.auth.admin.updateUserById(
      supabaseUser.data.user.id,
      {
        password: tempPassword,
        email: fakeEmail
      }
    );

    const { data: sessionData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: fakeEmail,
      password: tempPassword,
    });

    if (signInError || !sessionData.session) {
      console.error('Failed to create session:', signInError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
      user: sessionData.user
    });
  } catch (err: any) {
    console.error('Firebase sync error:', err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
