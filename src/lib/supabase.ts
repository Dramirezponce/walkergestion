// src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Indica si las variables de entorno están configuradas */
export const isConfigured = !!url && !!anon;

/** Cliente de Supabase (o null si falta configuración) */
export let supabase: SupabaseClient | null = null;

if (isConfigured) {
  supabase = createClient(url!, anon!, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
} else {
  // Aviso útil en desarrollo si faltan las env
  if (import.meta.env.DEV) {
    console.warn(
      "[Supabase] Faltan variables de entorno. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local"
    );
  }
}

/** Helper seguro para obtener el cliente ya configurado */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local"
    );
  }
  return supabase;
}