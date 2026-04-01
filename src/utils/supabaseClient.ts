import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars prefixed with VITE_ via import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabaseClient] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Supabase client will not be initialized correctly.');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

// Attach to window for live debugging (Fixes ReferenceError in console)
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

export type SupabaseClientType = typeof supabase;
