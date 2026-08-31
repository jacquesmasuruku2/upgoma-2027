# Guide de Configuration des Emails - Système UPG

## Configuration avec Resend (Recommandé)

### 1. Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte gratuit
3. Vérifiez votre domaine d'envoi (upgoma.org ou autre)

### 2. Obtenir la clé API

1. Dans le dashboard Resend, allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Copiez la clé (commence par `re_`)

### 3. Configurer le projet Supabase

#### Option A: Via le Dashboard Supabase

1. Allez sur votre projet Supabase
2. Naviguez vers **Edge Functions** → **Settings**
3. Ajoutez la variable d'environnement :
   - **Name**: `RESEND_API_KEY`
   - **Value**: votre clé Resend (ex: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

#### Option B: Via CLI (si vous avez Supabase CLI installé)

```bash
supabase functions deploy send-reset-email
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Déployer l'Edge Function

```bash
cd apps/systems
supabase functions deploy send-reset-email
```

### 5. Configurer le .env local

Ajoutez dans votre fichier `.env` :

```bash
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 6. Tester

1. Lancez l'application : `npm run dev:systems`
2. Allez sur `/login-etudiant`
3. Cliquez sur "Mot de passe oublié ?"
4. Entrez un email
5. Vérifiez votre boîte de réception

## Alternative: Configuration SMTP personnalisé

Si vous préférez utiliser votre propre serveur SMTP (Gmail, Outlook, etc.) :

### Configuration Gmail

1. Activez la 2FA sur votre compte Google
2. Allez dans **Compte Google** → **Sécurité** → **2-Step Verification**
3. Cliquez sur **App passwords**
4. Créez un nouveau mot de passe d'application
5. Copiez le mot de passe généré

### Variables d'environnement

```bash
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@email.com
SMTP_PASSWORD=votre_mot_de_passe_application
SMTP_FROM=noreply@upgoma.org
```

### Note importante

Pour utiliser SMTP personnalisé, vous devez modifier l'Edge Function pour utiliser Nodemailer au lieu de Resend. Contactez-moi si vous souhaitez cette configuration.

## Dépannage

### Email non reçu

1. Vérifiez le dossier Spam/Promotions
2. Vérifiez que la clé API Resend est correcte
3. Vérifiez les logs de l'Edge Function dans Supabase Dashboard

### Erreur "Email service not configured"

1. Vérifiez que `RESEND_API_KEY` est configurée dans Supabase Edge Functions
2. Redéployez l'Edge Function après avoir ajouté la clé

### Erreur lors de l'envoi

1. Vérifiez que votre domaine est vérifié dans Resend
2. Vérifiez les quotas d'envoi de Resend (gratuit: 3000 emails/mois)
