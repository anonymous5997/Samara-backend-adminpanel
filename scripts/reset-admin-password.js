const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPassword() {
  try {
    const adminEmail = 'blystaiteam@gmail.com';
    const newPassword = 'Blyst@123';

    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }

    const adminUser = users.users.find(u => u.email === adminEmail);

    if (!adminUser) {
      console.error('Admin user not found');
      process.exit(1);
    }

    console.log('Found admin user:', adminUser.id);

    const { data, error } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { password: newPassword }
    );

    if (error) {
      console.error('Error updating password:', error);
      process.exit(1);
    }

    console.log('Password updated successfully!');
    console.log('You can now login with:');
    console.log('Email:', adminEmail);
    console.log('Password:', newPassword);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

resetAdminPassword();
