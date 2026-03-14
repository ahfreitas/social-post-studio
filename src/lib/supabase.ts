import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnfdquetlszpwwjspdey.supabase.co';
const supabaseAnonKey = 'sb_publishable_uj8bamiY9Jxg6wdAbE8SbQ_vv4oessn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
