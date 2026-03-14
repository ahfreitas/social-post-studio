import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnfdquetlszpwwjspdey.supabase.co';
const supabaseAnonKey = 'sb_publishable_DxuBN78zp8X55U70pMor9A_lBYgYNDV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
