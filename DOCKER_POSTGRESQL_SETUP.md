# 🔧 Guide Complet : Test Docker PostgreSQL Local

## 📋 Résumé des problèmes résolus

### Problème 1: Erreurs de syntaxe SQL
- ❌ `NOTNULL` collé → ✅ `NOT NULL` séparé
- ❌ `MODIFY` (MySQL) → ✅ `ALTER COLUMN SET DATA TYPE` (PostgreSQL)
- ❌ Guillemets simples autour des noms → ✅ Guillemets doubles ou rien

### Problème 2: Dépendances Supabase
- ❌ `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (RLS) → ✅ Supprimé
- ❌ `auth.users(id)` → ✅ Schéma `auth` créé localement ou références supprimées
- ❌ `auth.uid()`, `auth.role()` → ✅ Fonctions Supabase supprimées
- ❌ `storage.buckets` → ✅ Supprimé (pas de storage en local)

### Problème 3: Container Docker
- ❌ Mot de passe incorrect/inconnu → ✅ Recréé avec `UpgAccess123!`
- ❌ Pas de volume persistant → ✅ Ajout de `postgres_data volume`

---

## ✅ ÉTAPES COMPLÈTES

### Étape 1: Recréer le container PostgreSQL

**Option A: Utiliser le script PowerShell (RECOMMANDÉ)**
```powershell
cd upgoma-website-main
.\scripts\recreate-postgres-container.ps1
```

**Option B: Commandes manuelles**
```powershell
# Arrêter et supprimer l'ancien container
docker stop ma-base-postgres
docker rm ma-base-postgres

# Créer un nouveau container PostgreSQL 15
docker run -d `
  --name ma-base-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=UpgAccess123! `
  -e POSTGRES_DB=systeme_academique `
  -p 5432:5432 `
  -v postgres_data:/var/lib/postgresql/data `
  postgres:15

# Attendre le démarrage
Start-Sleep -Seconds 15

# Vérifier
docker ps | grep ma-base-postgres
```

### Étape 2: Vérifier la connexion

```powershell
# Test simple via Node.js
node scripts/pg-ping.mjs
```

**Résultat attendu:**
```
[db:ping] Connexion OK { 
  database: 'systeme_academique',
  role: 'postgres',
  server_addr: '172.17.0.2'
}
```

### Étape 3: Charger les données nettoyées dans PostgreSQL

Trois options:

#### Option 1: Via pgAdmin (UI)
1. Ouvre http://localhost:5050
2. Login: `admin@example.com` / `admin`
3. Clique sur "Servers" → "ma-base-postgres"
4. Clique sur "Query Tool"
5. Copie-colle le contenu de **l'un** des fichiers ci-dessous
6. Clique sur "Execute"

#### Option 2: Via psql (CLI)
```powershell
# Si PostgreSQL Client est installé localement
$env:PGPASSWORD = "UpgAccess123!"
psql -h localhost -U postgres -d systeme_academique -f deploy/postgresql/partners_clean.sql
psql -h localhost -U postgres -d systeme_academique -f deploy/postgresql/students_admission_clean.sql
```

#### Option 3: Via docker exec (CLI dans le container)
```powershell
# Partners
docker exec -i ma-base-postgres psql -U postgres -d systeme_academique < deploy/postgresql/partners_clean.sql

# Students
docker exec -i ma-base-postgres psql -U postgres -d systeme_academique < deploy/postgresql/students_admission_clean.sql
```

---

## 📁 Fichiers SQL Nettoyés (PostgreSQL Standard)

### 1. **deploy/postgresql/partners_clean.sql**
- ✅ Tables `partners` et `partnership_requests`
- ✅ Indexes et commentaires
- ✅ Triggers pour `updated_at`
- ❌ RLS policies supprimées
- ❌ `auth.role()` supprimé
- ✅ Compatible: PostgreSQL 14+

### 2. **deploy/postgresql/students_admission_clean.sql**
- ✅ Table `students` avec tous les champs d'admission
- ✅ Views: `v_pending_applications`, `v_application_stats`
- ✅ Utilitaires: `get_student_full_name()`, `check_student_email_exists()`
- ❌ RLS policies supprimées
- ❌ `auth.uid()` supprimé
- ❌ `storage.buckets` supprimé
- ✅ Compatible: PostgreSQL 14+

---

## 🧪 Test Complet (Étapes par étapes)

### 1. Vérifier le container
```powershell
docker ps | grep ma-base-postgres
# Devrait afficher: UP (healthy) depuis quelques secondes
```

### 2. Vérifier la connexion
```powershell
node scripts/pg-ping.mjs
# Devrait afficher: [db:ping] Connexion OK { ... }
```

### 3. Charger les tables
```powershell
# Option préférée: docker exec
docker exec -i ma-base-postgres psql -U postgres -d systeme_academique < deploy/postgresql/partners_clean.sql
docker exec -i ma-base-postgres psql -U postgres -d systeme_academique < deploy/postgresql/students_admission_clean.sql
```

### 4. Vérifier les tables
```powershell
# Lancer le script de ping pour vérifier la connexion
node scripts/pg-ping.mjs

# Optionnellement, avec psql:
$env:PGPASSWORD = "UpgAccess123!"
psql -h localhost -U postgres -d systeme_academique -c "\dt"
# Devrait afficher: partners, partnership_requests, students
```

### 5. Vérifier les données (optional)
```powershell
psql -h localhost -U postgres -d systeme_academique -c "SELECT COUNT(*) FROM public.students;"
psql -h localhost -U postgres -d systeme_academique -c "SELECT COUNT(*) FROM public.partners;"
```

---

## 🚀 Commandes Utiles

### Consulter les logs du container
```powershell
docker logs ma-base-postgres
docker logs ma-base-postgres -f  # Suivi en temps réel
```

### Exécuter des requêtes dans le container
```powershell
docker exec -it ma-base-postgres psql -U postgres -d systeme_academique
# Ensuite: SELECT * FROM public.students;
#         \q pour quitter
```

### Backup de la base
```powershell
docker exec ma-base-postgres pg_dump -U postgres -d systeme_academique > backup.sql
```

### Restore à partir d'un backup
```powershell
docker exec -i ma-base-postgres psql -U postgres -d systeme_academique < backup.sql
```

### Arrêter/Redémarrer le container
```powershell
docker stop ma-base-postgres      # Arrêter
docker start ma-base-postgres     # Redémarrer
```

---

## 📊 Configuration finale du .env

```env
# Supabase (optionnel pour le site)
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# PostgreSQL local en Docker ✅
DATABASE_URL=postgresql://postgres:UpgAccess123!@localhost:5432/systeme_academique

# API admission (Node.js)
ADMISSION_API_PORT=8787
VITE_ADMISSION_API_BASE=http://localhost:8787
```

---

## ✨ Prochaines étapes

1. ✅ Recréer le container Docker
2. ✅ Charger les fichiers SQL nettoyés
3. ✅ Tester la connexion avec `npm run db:ping`
4. ✅ Lancer l'API admission: `npm run dev:server`
5. ✅ Tester le formulaire /admission localement
6. 📦 **Hébergement serveur** (après validation locale complète)

---

## ❓ Troubleshooting

### "Connection refused"
→ Le container n'est pas prêt. Attends 15 secondes et réessaie.

### "Authentication failed"
→ Utilise le bon mot de passe: `UpgAccess123!`

### "RLS policy not found"
→ C'est normal! Les fichiers `*_clean.sql` suppriment intentionnellement les RLS.

### "auth.users table not found"
→ Le schéma `auth` n'existe pas en PostgreSQL standard. Utilise les fichiers `*_clean.sql` qui n'en dépendent pas.

---

**Date de création:** 2026-06-10
**Version PostgreSQL:** 15
**Mot de passe:** UpgAccess123!
**Base:** systeme_academique
