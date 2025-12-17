import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Profile Ensure API Route
 *
 * CRITICAL: This route ensures a profile exists for an auth.users entry
 * - Called after successful authentication
 * - Creates profile with 'customer' role ONLY
 * - Never allows role updates from client
 * - Server-side validation ensures data integrity
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, phone, name } = body;

    // Validation
    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Either email or phone is required' },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', id)
      .maybeSingle();

    if (existing) {
      // Profile exists - only update non-sensitive fields
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          ...(name && { name }),
          ...(phone && !existing.phone && { phone }), // Only update if not already set
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        profile: existing,
        action: 'updated',
      });
    }

    // Profile doesn't exist - create new one with customer role
    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id,
        email: email || '',
        phone,
        name,
        role: 'customer', // ALWAYS customer - admins must be manually promoted
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    console.log(`[Profile Ensure] Created new customer profile: ${id}`);

    return NextResponse.json({
      success: true,
      profile: newProfile,
      action: 'created',
    });
  } catch (error) {
    console.error('Fatal error in profile ensure:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
