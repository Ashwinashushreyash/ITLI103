import fs from 'fs';
import path from 'path';

// Load .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  return Object.fromEntries(
    content
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
      .map(l => {
        const idx = l.indexOf('=');
        return [l.substring(0, idx).trim(), l.substring(idx + 1).trim().replace(/^["']|["']$/g, '')];
      })
  );
}

const env = loadEnv();
export const SUPABASE_URL = env.SUPABASE_URL || 'https://djbzmvcctcjnomaqathc.supabase.co';
export const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || '';

/**
 * Lightweight Supabase fetch helper without requiring external npm packages
 */
export async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}
