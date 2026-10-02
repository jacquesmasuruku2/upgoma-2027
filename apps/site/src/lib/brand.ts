import { SITE_URL } from "../config/seo";

/**
 * Logo principal UPG — fichier **`public/logo-upg.jpg`** (servi à la racine du site).
 * Toute image de marque dans l’app doit utiliser `LOGO_UPG_SRC` ou `LOGO_UPG_ABSOLUTE_URL`.
 */
const LOGO_UPG_FILE = "logo-upg.jpg";

/**
 * Incrémenter ce numéro à chaque nouveau fichier logo pour forcer le rechargement
 * (navigateur + CDN type Vercel, qui mettent souvent en cache les URLs statiques identiques).
 */
const LOGO_UPG_CACHE_QUERY = "v=3";

function publicAssetUrl(filename: string): string {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}${filename.replace(/^\//, "")}`;
}

/** URL du logo dans l’app (navbar, footer, préchargeur, admin). */
export const LOGO_UPG_SRC = `${publicAssetUrl(LOGO_UPG_FILE)}?${LOGO_UPG_CACHE_QUERY}`;

/** URL absolue (Open Graph, Twitter, e-mails) — alignée sur `SITE_URL`. */
export const LOGO_UPG_ABSOLUTE_URL = `${SITE_URL}/${LOGO_UPG_FILE}?${LOGO_UPG_CACHE_QUERY}`;
