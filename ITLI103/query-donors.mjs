import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseClient.js';

async function fetchDonors() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/blood_donors?select=*`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    console.error('Error fetching donors:', res.status, await res.text());
    return;
  }

  const donors = await res.json();
  console.log(`🎉 Found ${donors.length} donors in Supabase database:`);
  donors.forEach(d => {
    console.log(` - [${d.blood_group}] ${d.name} | Email: ${d.contact_email || 'N/A'} | Phone: ${d.mobile_number} | Location: ${d.address} (PIN: ${d.pin_code})`);
  });
}

fetchDonors();
