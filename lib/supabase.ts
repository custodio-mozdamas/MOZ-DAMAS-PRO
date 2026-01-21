
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pdgxguxtiuvtbaotczgj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oraQhI-Kd45itDWbAAoDNQ_U1GSjTXp';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
