# Configuration des e-mails UPG

## Confirmation d’inscription

Le formulaire `/admission` envoie les champs et pièces jointes à l’API Node `apps/server/server/admission-api.mjs`. Le backend enregistre le dossier dans Supabase, stocke la photo dans Cloudinary, stocke les PDF dans un bucket Cloudflare R2 privé, puis envoie la confirmation par l’API Brevo ou par SMTP Brevo. Aucun secret fournisseur n’est envoyé au navigateur.

Dans le `.env` racine, configure les variables suivantes côté serveur :

```dotenv
# Brevo API, optionnel si SMTP_HOST/SMTP_USER/SMTP_PASS sont configurés
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=Université Polytechnique de Goma

# Cloudinary : photo passeport
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Cloudflare R2 : PDF privés
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=upg-admissions

# API derrière le reverse proxy
CORS_ORIGINS=http://localhost:8080
TRUST_PROXY_HOPS=0
```

Les variables SMTP Brevo déjà utilisées par le backend (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`) servent de solution de repli si la clé API Brevo n’est pas renseignée. Configure les secrets sur le VPS dans l’environnement du service Node; ne préfixe jamais une clé serveur par `VITE_`.

Le bucket R2 doit rester privé. Les colonnes de documents contiennent des références `r2://...`; la photo passeport utilise l’URL sécurisée Cloudinary. En local, Vite relaie `/api` vers `127.0.0.1:8787`. En production, Nginx/Cloudflare doit transmettre `/api/*` au backend Node.

Le `.env.example` documente les noms des variables, sans valeurs de secrets. Le `.env` local est ignoré par Git.

## Invitations et paramètres de compte

L’authentification applicative est gérée par le serveur Node et CockroachDB, pas par Supabase Auth. Les mots de passe sont hachés avec `scrypt`; les sessions sont stockées en base et exposées au navigateur uniquement par cookie `HttpOnly`. Supabase reste utilisé par certaines fonctionnalités de données existantes, mais il n’émet plus les sessions de connexion.

Les super administrateurs invitent les utilisateurs depuis **Paramètres**. L’API vérifie la session et le rôle dans CockroachDB, crée un jeton à usage unique et envoie le lien par Brevo ou SMTP. L’invité choisit son propre mot de passe; aucun mot de passe temporaire n’est transmis. Les réinitialisations utilisent le même mécanisme.

La base doit avoir reçu [native_auth.sql](deploy/postgresql/native_auth.sql). Pour amorcer le premier compte administrateur, lancez `node server/bootstrap-super-admin.mjs <email> [nom]` depuis `apps/server`; le mot de passe est saisi masqué dans le terminal et n’est jamais inclus dans la commande. Après cet amorçage, les invitations se font depuis l’interface.

Configurez `APP_PUBLIC_URL` avec l’URL de l’application qui héberge `/reset-password`, ainsi que les paramètres Brevo (`BREVO_API_KEY` et `BREVO_SENDER_EMAIL`) ou SMTP. Ajoutez l’origine de l’application à `CORS_ORIGINS`. La clé d’API Brevo reste uniquement dans l’environnement du serveur Node.

Les utilisateurs connectés peuvent modifier leur mot de passe dans les paramètres après vérification du mot de passe actuel. Les nouveaux mots de passe doivent comporter au moins 12 caractères, une majuscule, une minuscule, un chiffre et un symbole.

## Campagnes newsletter

Depuis **Gestion du site → Newsletter**, un super administrateur peut choisir un article publié, un communiqué ou un message personnalisé, modifier l’objet et le contenu, prévisualiser puis envoyer la campagne aux adresses confirmées et non désabonnées. Chaque envoi est conservé dans `public.newsletter_campaigns` avec les compteurs de livraison; chaque email comprend un lien de désabonnement individuel. `APP_PUBLIC_URL` doit désigner le domaine public du site principal afin que ces liens ne renvoient pas vers l’interface d’administration.

## Réinitialisation du mot de passe

La demande de réinitialisation passe par l’API Node; l’e-mail part via Brevo ou SMTP et contient un jeton à usage unique stocké haché dans CockroachDB. Aucun service d’authentification Supabase n’est appelé.

## Newsletter du site

Le formulaire du pied de page enregistre les demandes dans `public.newsletter_subscribers` sur CockroachDB via l’API Node. La confirmation d’adresse passe également par `/api/newsletter/confirm`; la liste admin est disponible dans **Gestion du site → Newsletter** et exige une session super administrateur. Les messages de confirmation utilisent le même relais Brevo/SMTP et `APP_PUBLIC_URL` pour construire le lien public. Les abonnements historiques restés dans Supabase ne sont pas importés automatiquement.

## Dépannage

- Si le dossier est enregistré mais que l’e-mail échoue, vérifier les logs de l’API Node et les journaux d’envoi Brevo. La page `/admission-success` indique cet échec.
- Si les fichiers ne sont pas enregistrés, vérifier les clés Cloudinary/R2 et les droits d’écriture du bucket.
- Pour un VPS derrière Nginx/Cloudflare, régler `CORS_ORIGINS` sur l’origine exacte du site et `TRUST_PROXY_HOPS` sur le nombre réel de proxies de confiance.
