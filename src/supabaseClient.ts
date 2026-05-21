import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Atenção: Variáveis do Supabase não encontradas. O banco não funcionará corretamente.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
