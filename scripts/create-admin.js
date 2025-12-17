const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'found' : 'missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'found' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdmin() {
  const email = 'blystaiteam@gmail.com';
  const password = 'Blyst@123';

  try {
    console.log('Creating admin user...');

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'Admin User',
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError.message);
      process.exit(1);
    }

    console.log('✓ Auth user created:', authData.user.id);

    // Create profile with admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        name: 'Admin User',
        role: 'admin',
      });

    if (profileError) {
      console.error('Error creating profile:', profileError.message);
      process.exit(1);
    }

    console.log('✓ Admin profile created');
    console.log('\n✓ Admin user successfully created!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\nYou can now log in and access the admin panel.');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

createAdmin();
