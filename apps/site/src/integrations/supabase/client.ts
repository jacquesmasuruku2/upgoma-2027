// Point d’entrée unique : toutes les requêtes (hooks, pages, admin) passent par ce client.
// Configuration uniquement via variables d’environnement Vite (`.env`, Vercel, etc.) :
//   VITE_SUPABASE_URL (prioritaire) ou VITE_SUPABASE_PROJECT_ID → URL du projet
//   VITE_SUPABASE_PUBLISHABLE_KEY → clé anon
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getStorageForSupabase } from '../../lib/safeStorage';

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const envProjectId = (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined)?.trim();
const envKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim();

const SUPABASE_URL =
  envUrl ||
  (envProjectId ? `https://${envProjectId}.supabase.co` : '') ||
  'https://env-manquant.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.env-manquant';

/** URL du projet Supabase réellement utilisée par l’app (pour debug / cohérence). */
export const SUPABASE_RESOLVED_URL = SUPABASE_URL;

if (envUrl && envProjectId) {
  try {
    const host = new URL(envUrl).hostname;
    const expected = `${envProjectId}.supabase.co`;
    if (host !== expected) {
      console.warn(
        `[UPG] VITE_SUPABASE_URL (${host}) ne correspond pas à VITE_SUPABASE_PROJECT_ID (${expected}). L’URL du .env est appliquée.`,
      );
    }
  } catch {
    /* URL invalide : laisser createClient échouer plus tard si besoin */
  }
}

if (!envKey) {
  console.warn(
    '[UPG] Définissez VITE_SUPABASE_PUBLISHABLE_KEY dans .env (ou variables d’hébergement). Les appels Supabase échoueront sans clé anon.',
  );
}
if (!envUrl && !envProjectId) {
  console.warn(
    '[UPG] Définissez VITE_SUPABASE_URL ou VITE_SUPABASE_PROJECT_ID pour l’URL du projet.',
  );
}

if (SUPABASE_URL.includes('env-manquant')) {
  console.error(
    `[UPG] SUPABASE_URL placeholder détectée (${SUPABASE_URL}). ` +
      `Le site ne pourra pas communiquer avec la base Supabase. ` +
      `Corriger les variables Vercel (VITE_SUPABASE_URL ou VITE_SUPABASE_PROJECT_ID).`,
  );
}

if (SUPABASE_PUBLISHABLE_KEY.includes('env-manquant')) {
  console.error(
    '[UPG] VITE_SUPABASE_PUBLISHABLE_KEY manquante : impossible de contacter Supabase (clé anon placeholder). ' +
      'Corriger les variables Vercel / .env.',
  );
}

if (!SUPABASE_URL.includes('env-manquant') && import.meta.env.DEV) {
  console.info(`[UPG] Base Supabase (données du site) : ${SUPABASE_URL}`);
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: getStorageForSupabase(),
    persistSession: true,
    autoRefreshToken: true,
  },
});
