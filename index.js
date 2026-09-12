import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseRequest } from './supabaseClient.js';

console.log('🚀 Supabase Connection Initialized:');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

async function main() {
  console.log('\nChecking service status...');
  const health = await supabaseRequest('/auth/v1/settings');
  if (health.ok) {
    console.log('✅ Supabase Auth Service is reachable and responsive.');
  } else {
    console.error('❌ Failed to reach Auth Service:', health.status, health.data);
  }

  const storage = await supabaseRequest('/storage/v1/bucket');
  if (storage.ok) {
    console.log('✅ Supabase Storage Service is reachable.');
  } else {
    console.error('❌ Failed to reach Storage Service:', storage.status, storage.data);
  }
}

main();
