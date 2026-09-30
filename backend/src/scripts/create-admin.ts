import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://takqjthgdwuqavnvyoxb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRha3FqdGhnZHd1cWF2bnZ5b3hiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDM4NDU0OCwiZXhwIjoyMTA1OTYwNTQ4fQ.6cGWT1N58sgPiCcwMxGSPDemyXTSgp5Z3LKroFtdrpk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createAdminUser() {
  console.log('Creating admin user admin@gmail.com...');
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@gmail.com',
    password: '123456',
    email_confirm: true,
  });

  if (error) {
    console.error('Failed to create user:', error.message);
  } else {
    console.log('Successfully created admin user!');
    console.log('User ID:', data.user.id);
  }
}

createAdminUser();
