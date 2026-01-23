
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://oygieberxpehnifteojj.supabase.co';
const supabaseKey = 'sb_publishable__6I4wPbkVUhV65qGvAlPrA_Rve_S24-';

export const supabase = createClient(supabaseUrl, supabaseKey);
