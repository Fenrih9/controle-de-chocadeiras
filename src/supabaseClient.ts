import { createClient, SupportedStorage } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Atenção: Variáveis do Supabase não encontradas. O banco não funcionará corretamente.');
}

// Storage temporário em memória para celulares/navegadores que bloqueiam cookies ou localStorage
class MemoryStorage implements SupportedStorage {
  private data: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.data[key] || null;
  }
  setItem(key: string, value: string): void {
    this.data[key] = value;
  }
  removeItem(key: string): void {
    delete this.data[key];
  }
}

const getSafeStorage = (): SupportedStorage => {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (e) {
    console.warn('LocalStorage bloqueado ou indisponível. Usando MemoryStorage.', e);
    return new MemoryStorage();
  }
};

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: getSafeStorage(),
    persistSession: true,
    detectSessionInUrl: true,
  }
});
