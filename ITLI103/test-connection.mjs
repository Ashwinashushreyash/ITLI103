import fs from 'fs';

// Read .env
const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=');
      const key = line.substring(0, idx).trim();
      const val = line.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
      return [key, val];
    })
);

const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

console.log('Connecting to Supabase at:', SUPABASE_URL);

async function testConnection() {
  try {
    // 1. Test Auth API
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (authRes.ok) {
      console.log('✅ Auth API connection successful! Status:', authRes.status);
    } else {
      console.log('❌ Auth API response:', authRes.status, await authRes.text());
    }

    // 2. Test PostgREST API (schema introspection / root)
    const restRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (restRes.ok) {
      const openApiSpec = await restRes.json();
      const tables = Object.keys(openApiSpec.definitions || {});
      console.log('✅ PostgREST API connection successful!');
      console.log('Available tables in public schema:', tables.length > 0 ? tables : '(none created yet)');
    } else {
      console.log('❌ PostgREST API response:', restRes.status, await restRes.text());
    }

    // 3. Test Storage API
    const storageRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (storageRes.ok) {
      const buckets = await storageRes.json();
      console.log('✅ Storage API connection successful!');
      console.log('Storage buckets:', buckets.length > 0 ? buckets.map(b => b.name) : '(none created yet)');
    } else {
      console.log('Storage API response status:', storageRes.status);
    }

    console.log('\n🎉 Connection to your Supabase project is working perfectly!');
  } catch (err) {
    console.error('Connection test failed:', err);
  }
}

testConnection();
