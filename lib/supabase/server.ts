import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * Client Supabase côté serveur (composants serveur, route handlers).
 * Mémoïsé sur la requête : un écran qui lit le profil, le Shabbat et les
 * missions construisait trois clients pour une seule et même session.
 */
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();

  // Le client est typé sur le schéma réel (`database.types.ts`, régénéré par
  // `npm run types`) : les colonnes et leurs types viennent de la base, et
  // non plus d'assertions écrites à la main.
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Appelé depuis un composant serveur : le middleware rafraîchit
            // déjà la session, on peut ignorer sans risque.
          }
        },
      },
    },
  );
});
