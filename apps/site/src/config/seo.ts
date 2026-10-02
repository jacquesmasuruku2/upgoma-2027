/** URL canonique du site (version www — alignée avec Search Console et redirections Vercel) */
export const SITE_URL = "https://www.upgoma.org";

export type SeoMeta = {
  title: string;
  description: string;
  /** true = ne pas indexer (admin, pages techniques) */
  noindex?: boolean;
};

const defaultMeta: SeoMeta = {
  title: "Université Polytechnique de Goma | Excellence Polytechnique",
  description:
    "L'Université Polytechnique de Goma (UPG) — formation d'excellence en ingénierie et sciences appliquées à Goma, RD Congo.",
};

/** Pages statiques connues — titres uniques pour le SEO */
export const routeSeo: Record<string, SeoMeta> = {
  "/": {
    title: "Université Polytechnique de Goma | Accueil",
    description:
      "UPG Goma : université polytechnique d'excellence. Formations, facultés, actualités et vie étudiante en RD Congo.",
  },
  "/about": {
    title: "Présentation | Université Polytechnique de Goma",
    description:
      "Découvrez l'Université Polytechnique de Goma : mission, vision, histoire et engagement pour l'excellence technique au service du développement de la RD Congo.",
  },
  "/admission": {
    title: "Admissions | Université Polytechnique de Goma",
    description:
      "Admission à l'UPG Goma : postulez en ligne aux formations d'excellence en ingénierie, sciences économiques, santé et management.",
  },
  "/contact": {
    title: "Contact | Université Polytechnique de Goma",
    description: "Contactez l'UPG Goma : +243 informations, localisation à Goma, email et formulaire de contact pour les étudiants et partenaires.",
  },
  "/faq": {
    title: "FAQ - Questions Fréquentes | Université Polytechnique de Goma",
    description: "Toutes vos questions sur l'admission, les programmes, frais de scolarité et vie étudiante à l'Université Polytechnique de Goma.",
  },
  "/blog": {
    title: "Blog Actualités | Université Polytechnique de Goma",
    description: "Actualités UPG : événements, nouvelles académiques, publications scientifiques et vie campus de l'Université Polytechnique de Goma.",
  },
  "/galerie": {
    title: "Galerie photos | Université Polytechnique de Goma",
    description: "Photos du campus, des événements et de la vie à l'UPG.",
  },
  "/personnel": {
    title: "Personnel & autorités | Université Polytechnique de Goma",
    description: "Équipe administrative et académique de l'Université Polytechnique de Goma.",
  },
  "/college-etudiants": {
    title: "Collège des étudiants | Université Polytechnique de Goma",
    description: "Représentation étudiante, annonces et vie associative à l'UPG.",
  },
  "/frais": {
    title: "Frais académiques | Université Polytechnique de Goma",
    description: "Informations sur les frais de scolarité par faculté et par cycle à l'UPG.",
  },
  "/bibliotheque": {
    title: "Bibliothèque numérique | Université Polytechnique de Goma",
    description: "Ressources documentaires et accès à la bibliothèque de l'UPG.",
  },
  "/services": {
    title: "Nos services | Université Polytechnique de Goma",
    description: "Services offerts aux étudiants et à la communauté par l'Université Polytechnique de Goma.",
  },
  "/politique-de-confidentialite": {
    title: "Politique de confidentialité | Université Polytechnique de Goma",
    description: "Politique de confidentialité et traitement des données sur www.upgoma.org.",
  },
  "/confirmer-newsletter": {
    title: "Confirmation newsletter | Université Polytechnique de Goma",
    description: "Confirmation d'inscription à la newsletter de l'UPG.",
  },
  "/admission-success": {
    title: "Inscription Réussie | Université Polytechnique de Goma",
    description: "Félicitations ! Votre inscription à l'Université Polytechnique de Goma a été confirmée. Téléchargez votre attestation et découvrez les prochaines étapes.",
  },
};

/** Routes valides côté app (hors 404) — pour meta robots sur URLs inconnues */
export function isKnownRoute(pathname: string): boolean {
  if (Object.prototype.hasOwnProperty.call(routeSeo, pathname)) return true;
  if (/^\/faculte\/[^/]+$/.test(pathname)) return true;
  if (/^\/service\/[^/]+$/.test(pathname)) return true;
  return false;
}

export function getSeoForPath(pathname: string, search: string): SeoMeta {
  if (pathname === "/blog" && search.includes("article=")) {
    return {
      title: "Article | Université Polytechnique de Goma",
      description: "Lire l'article sur le site de l'Université Polytechnique de Goma.",
    };
  }
  if (pathname === "/college-etudiants" && search.includes("post=")) {
    return {
      title: "Collège des étudiants — publication | UPG Goma",
      description: "Annonce ou publication du collège des étudiants de l'Université Polytechnique de Goma.",
    };
  }
  if (routeSeo[pathname]) {
    return routeSeo[pathname];
  }
  if (pathname.startsWith("/faculte/")) {
    return {
      title: "Faculté | Université Polytechnique de Goma",
      description: "Programmes et départements de la faculté à l'Université Polytechnique de Goma.",
    };
  }
  if (pathname.startsWith("/service/")) {
    return {
      title: "Service | Université Polytechnique de Goma",
      description: "Présentation d'un service de l'Université Polytechnique de Goma.",
    };
  }
  return defaultMeta;
}
