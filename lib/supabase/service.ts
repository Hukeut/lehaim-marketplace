import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec la clé service_role — contourne la RLS.
 *
 * Nécessaire pour le webhook Grow (server-to-server) : ces requêtes
 * n'arrivent pas avec des cookies de session utilisateur, donc le client
 * SSR habituel (lib/supabase/server.ts) ne peut rien lire ni écrire.
 *
 * Vérifiez la valeur de SUPABASE_SERVICE_ROLE_KEY dans .env.local avant de
 * déployer : son JWT doit contenir "role":"service_role", pas "role":"anon"
 * (une clé anon échouera silencieusement sur toute table protégée par RLS).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont nécessaires pour le webhook Grow.");
  }
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
