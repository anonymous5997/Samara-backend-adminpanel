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

    // Verify Firebase OTP
    const decoded = await verifyFirebaseToken(firebaseToken);

    const firebase_uid = decoded.uid;
    const phone = decoded.phone_number;

    // Check user
    let { data: user } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("firebase_uid", firebase_uid)
      .single();

    // Create user AFTER OTP
    if (!user) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .insert({ firebase_uid, phone })
        .select()
        .single();

      user = data;
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 401 }
    );
  }
}
