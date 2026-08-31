import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env' });

const url = process.env.VITE_SUPABASE_URL || `https://${process.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
console.log('url', url);
console.log('key present', Boolean(key));

const supabase = createClient(url, key);

const { data: rows, error: selectErr } = await supabase.from('students').select('id, status, matricule').limit(3);
console.log('selectErr', selectErr);
console.log('rows', JSON.stringify(rows, null, 2));

if (rows && rows.length > 0) {
  const id = rows[0].id;
  const { data, error } = await supabase.from('students').update({ status: 'approved', matricule: rows[0].matricule || 'TEST' }).eq('id', id).select();
  console.log('updateErr', error);
  console.log('updated', JSON.stringify(data, null, 2));
}
