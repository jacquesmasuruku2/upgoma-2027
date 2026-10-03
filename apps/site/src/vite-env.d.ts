/// <reference types="vite/client" />

/** Variables exposées au client (préfixe `VITE_` obligatoire). Définir dans `.env` à la racine. */
interface ImportMetaEnv {
  /** Identifiant projet Supabase (réf. URL). Utilisé si `VITE_SUPABASE_URL` est absent. */
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  /** URL du projet, ex. `https://xxxxx.supabase.co` — prioritaire sur l’URL dérivée du project id. */
  readonly VITE_SUPABASE_URL?: string;
  /** Clé publique (anon) — requise pour le client Supabase. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_ADMIN_ALLOWED_EMAILS?: string;
  /** Origine publique de l’API admission (CockroachDB + R2), obligatoire en production. */
  readonly VITE_ADMISSION_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
