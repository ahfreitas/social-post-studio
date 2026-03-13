import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quxnygeglmdrzukqpmqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1eG55Z2VnbG1kcnp1a3FwbXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODA5NTUsImV4cCI6MjA3Njc1Njk1NX0.KxWmS8jHW2efVMzCvos7q0CAdxUwHcRObHxcZWwk-uM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
