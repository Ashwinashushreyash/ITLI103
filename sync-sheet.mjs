import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseClient.js';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1IdAQCcmv9LfYV2hbLtyPI7zb3-RgpMSj9ANoaXET7cM/export?format=csv';

function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal.trim());
      if (row.some(val => val.length > 0)) {
        lines.push(row);
      }
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (row.length > 0 && row.some(val => val.length > 0)) {
    row.push(currentVal.trim());
    lines.push(row);
  }

  return lines;
}

export async function syncBloodDonors() {
  console.log('📥 Fetching live sheet data...');
  const res = await fetch(SHEET_CSV_URL);
  if (!res.ok) {
    throw new Error(`Failed to download spreadsheet: ${res.statusText}`);
  }

  const csvText = await res.text();
  const rows = parseCSV(csvText);

  // Row 0 is "BLOOD DONOR DATA" title
  // Row 1 is header: Sl.no, Name, Blood Group, Contact Email, Mobile Number, Address, PIN CODE, Consent
  // Data starts at row 2
  const donors = [];

  for (let i = 2; i < rows.length; i++) {
    const [sl_no, name, blood_group, contact_email, mobile_number, address, pin_code, consent] = rows[i];
    // Ignore rows that don't have a valid name or blood group
    if (!name || !name.trim()) continue;

    donors.push({
      sl_no: parseInt(sl_no, 10) || null,
      name: name.trim(),
      blood_group: (blood_group || '').trim(),
      contact_email: (contact_email || '').trim(),
      mobile_number: (mobile_number || '').trim(),
      address: (address || '').trim(),
      pin_code: (pin_code || '').trim(),
      consent: (consent || '').trim(),
    });
  }

  // Deduplicate within the sheet data by mobile number (keep newest)
  const uniqueDonorsMap = new Map();
  for (const donor of donors) {
    if (donor.mobile_number) {
      uniqueDonorsMap.set(donor.mobile_number, donor);
    }
  }
  const uniqueDonors = Array.from(uniqueDonorsMap.values());
  console.log(`Found ${uniqueDonors.length} unique donor records in Google Sheet.`);

  // 1. Fetch existing mobile numbers from Supabase to prevent duplicates
  console.log('🔍 Checking existing records in Supabase...');
  let existingPhones = new Set();
  try {
    const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/blood_donors?select=mobile_number`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (existingRes.ok) {
      const existingList = await existingRes.json();
      existingPhones = new Set(existingList.map(item => String(item.mobile_number).trim()));
      console.log(`Found ${existingPhones.size} existing donor mobile number(s) in Supabase.`);
    } else {
      console.warn('⚠️ Could not fetch existing donors (status ' + existingRes.status + '). Proceeding carefully.');
    }
  } catch (err) {
    console.warn('⚠️ Error checking Supabase records:', err.message);
  }

  // 2. Filter down to only brand-new donors
  const newDonors = uniqueDonors.filter(d => !existingPhones.has(d.mobile_number));

  if (newDonors.length === 0) {
    console.log('✨ All donors from the Google Sheet are already in Supabase! No new records to insert.');
    return;
  }

  console.log(`\nFound ${newDonors.length} new donor record(s) to add:`);
  newDonors.forEach(d => console.log(` + [${d.blood_group}] ${d.name} (${d.mobile_number}) - ${d.address}`));

  console.log('\nUploading new donors to Supabase table "blood_donors"...');

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/blood_donors`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(newDonors),
  });

  if (insertRes.ok) {
    console.log(`✅ Successfully synced ${newDonors.length} new records to Supabase!`);
  } else {
    const errText = await insertRes.text();
    console.error(`❌ Supabase upload failed (status ${insertRes.status}):`, errText);
    console.log('\n💡 Tip: Make sure you created the "blood_donors" table in Supabase first using the provided SQL.');
  }
}

if (process.argv[1].endsWith('sync-sheet.mjs')) {
  syncBloodDonors().catch(console.error);
}
