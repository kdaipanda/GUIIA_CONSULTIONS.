import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Mantén el log en desarrollo para detectar configuración faltante.
  // En producción, considera silenciar o redirigir a un logger centralizado.
  console.warn('Supabase env vars missing: REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
