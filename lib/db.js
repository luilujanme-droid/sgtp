import { createClient } from '@supabase/supabase-js';

// Solo se usa en el servidor: la secret key nunca llega al navegador.
export const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});
