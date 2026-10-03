# 🎓 Upgoma Website - Monorepo

**Plateforme intégrée pour l'Université Polytechnique de Goma**

> Monorepo organisé avec npm workspaces pour gérer le frontend, backend, et modules académiques.

## 🚀 Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer tous les services
npm run dev

# 3. Ou lancer des services spécifiques
npm run dev:site        # Frontend (http://localhost:5173)
npm run dev:server      # Backend
npm run dev:systems     # Modules académiques
```

## 📖 Documentation

| Document | Contenu |
|----------|---------|
| [QUICK_START.md](./QUICK_START.md) | 🏃 Démarrage en 5 minutes |
| [MONOREPO.md](./MONOREPO.md) | 📋 Vue d'ensemble du monorepo |
| [docs/MONOREPO_SETUP.md](./docs/MONOREPO_SETUP.md) | ⚙️ Configuration détaillée |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 🤝 Guide de contribution |
| [TECH_STACK.md](./TECH_STACK.md) | 🛠️ Technologies utilisées |
| [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) | 🔄 Migration depuis l'ancienne structure |
| [CONFIGURATION_SUMMARY.md](./CONFIGURATION_SUMMARY.md) | 📊 Résumé de configuration |

## 📁 Structure du projet

```
upgoma-website-main/
├── apps/                          # Applications principales
│   ├── site/                      # 🌐 Frontend (Vite + React)
│   ├── server/                    # ⚙️ Backend (Express.js)
│   └── systems/                   # 📚 Modules académiques
├── packages/                      # Packages partagés
│   ├── ui/                        # 🎨 Composants UI
│   └── config/                    # ⚙️ Configuration commune
├── scripts/                       # 🔧 Scripts utilitaires
├── docs/                          # 📚 Documentation
├── supabase/                      # 🗄️ Configuration Supabase
├── cloudflare/                    # ☁️ Configuration Cloudflare
├── deploy/                        # 🚀 Configuration déploiement
└── MONOREPO.md                    # 📋 Guide monorepo
```

## 🔧 Commandes principales

### Développement
```bash
npm run dev              # Tous les services
npm run dev:site        # Frontend uniquement
npm run dev:server      # Backend uniquement
npm run dev:systems     # Modules académiques uniquement
```

### Build
```bash
npm run build            # Builder tous les workspaces
npm run build:site      # Builder le frontend
npm run build:server    # Builder le backend
npm run build:systems   # Builder les modules
```

### Qualité du code
```bash
npm run lint             # ESLint tous les workspaces
npm run test             # Tests tous les workspaces
npm run test:watch       # Tests en mode watch
```

## 📦 Workspaces

### `apps/site` - Frontend (@upgoma/site)
- **Tech**: Vite, React, TypeScript, Tailwind CSS
- **Port**: 5173
- **Build**: `npm --workspace=@upgoma/site run build`

### `apps/server` - Backend (@upgoma/server)
- **Tech**: Express.js, Node.js
- **Port**: 3000 (à configurer)
- **Start**: `npm --workspace=@upgoma/server run dev`

### `apps/systems` - Modules académiques (@upgoma/systems)
- **Tech**: Vite, React, TypeScript
- **Port**: 5174
- **Build**: `npm --workspace=@upgoma/systems run build`

### `packages/ui` - Composants UI (@upgoma/ui)
- **Tech**: React, Radix UI, Tailwind CSS
- **Usage**: Importez depuis `@upgoma/ui` dans les autres workspaces

### `packages/config` - Configuration (@upgoma/config)
- **Tech**: Configuration partagée (TypeScript, ESLint, etc.)
- **Usage**: Importez depuis `@upgoma/config`

## 🎯 Ajouter des dépendances

### À une application
```bash
npm install express --workspace=@upgoma/server
npm install react-router-dom --workspace=@upgoma/site
```

### À la racine (pour tous les workspaces)
```bash
npm install --workspace-root typescript
```

## 🔗 Navigation entre workspaces

```bash
# Frontend
cd apps/site && npm run dev

# Backend
cd apps/server && npm run dev

# Modules académiques
cd apps/systems && npm run dev

# Composants partagés
cd packages/ui && npm run dev

# Configuration
cd packages/config && npm run dev
```

## 🛠️ Technologies principales

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: CockroachDB pour l'authentification native et les admissions
- **Authentication**: API Node native, sessions cookie HttpOnly
- **Email transactionnel**: Brevo SMTP
- **Stockage des fichiers**: Cloudflare R2
- **Styling**: Tailwind CSS, Radix UI
- **Package Manager**: npm workspaces
- **Linting**: ESLint + TypeScript ESLint
- **Formatting**: Prettier
- **Testing**: Vitest
- **Editor**: VSCode (avec workspace config)

## Authentification et déploiement API

Les routes natives de session sont servies par `apps/server/server/admission-api.mjs`
sous `/api/auth/*`. En production, `system.upgoma.org` doit relayer `/api/*`
vers le service Node sur `127.0.0.1:8787` avec
[`deploy/nginx/admission-api-location.conf`](./deploy/nginx/admission-api-location.conf).
Sans ce proxy, l'hébergement statique ne peut pas traiter les requêtes POST d'authentification.

Configurer côté serveur `DATABASE_URL`, les variables Brevo SMTP, `APP_URL`,
les identifiants R2 et `CORS_ORIGINS` (incluant `https://system.upgoma.org`).
Les tables de session et de jetons sont créées par
[`deploy/postgresql/native_auth.sql`](./deploy/postgresql/native_auth.sql).

La migration des autres écrans de gestion académique hors Supabase n'est pas
encore achevée : les écrans de données listés dans `apps/systems/src` utilisent
encore l'ancien client pour certaines opérations. Ne supprimez pas sa dépendance
avant d'avoir migré ces appels vers des routes Node protégées.

## 📊 Statistiques

- ✅ 27 fichiers de configuration créés
- ✅ 5 workspaces configurés
- ✅ 7+ documents de documentation
- ✅ 3+ scripts utilitaires
- ✅ npm workspaces configurés
- ✅ TypeScript configuré avec path aliases
- ✅ ESLint + Prettier configurés

## 🤝 Contribution

Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour:
- Configuration du développeur
- Conventions de code
- Workflow de contribution
- Processus de review

## 🔍 Vérifier la configuration

```bash
# Vérifier que tout est configuré correctement
bash scripts/verify-monorepo.sh

# Ou avec Node.js
node scripts/verify-monorepo.js
```

## 📝 VSCode Workspace

Ouvrir le projet comme workspace:
```bash
code upgoma-website.code-workspace
```

Cela va charger tous les workspaces dans VSCode avec une meilleure navigation.

## 🚀 Déploiement

Consultez le dossier `deploy/` pour les instructions de déploiement:
- PostgreSQL deployment
- Supabase configuration
- Cloudflare Worker setup
- Vercel deployment

## 🐛 Dépannage

### "Cannot find module '@upgoma/ui'"
```bash
npm install
```

### Modifications dans packages/ui non visibles
```bash
# Redémarrer le serveur Vite
# Ctrl+C pour arrêter
# npm run dev pour relancer
```

### Nettoyage complet
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

- Consultez la [documentation](./MONOREPO.md)
- Lisez le [guide de contribution](./CONTRIBUTING.md)
- Vérifiez les [technologies utilisées](./TECH_STACK.md)
- Consultez le [guide de migration](./MIGRATION_GUIDE.md)

## 📄 License

À définir

## 👥 Contributeurs

- Jacques MASURUKU <jacquesmasuruku2@gmail.com>

---

**Prêt à démarrer?** 🚀

```bash
npm install && npm run dev
```

Profitez! 🎉
