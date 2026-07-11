# ✅ SOLUTION FINALE - PostgreSQL Sans Mot de Passe

## 🎯 Le problème
Les mots de passe ne fonctionnent pas car PostgreSQL en Docker utilise l'authentification **"trust"** localement.

## 🚀 La solution
Utiliser `-e POSTGRES_HOST_AUTH_METHOD=trust` et **pas de mot de passe** dans la DATABASE_URL.

---

## ⚡ Démarrage rapide (copie-colle)

### Option A: PowerShell
```powershell
# Nettoyer
docker stop ma-base-postgres 2>$null; docker rm ma-base-postgres 2>$null

# Créer le container SANS mot de passe
docker run -d --name ma-base-postgres -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=systeme_academique -p 5432:5432 postgres:15

# Attendre 20 secondes
Start-Sleep -Seconds 20

# Tester
docker exec ma-base-postgres psql -U postgres -d systeme_academique -c "SELECT 1;"

# Mettre à jour .env
echo 'DATABASE_URL=postgresql://postgres@localhost:5432/systeme_academique' > .env

# Tester avec pg-ping
node scripts/pg-ping.mjs
```

### Option B: Node.js (recommandé)
```bash
node scripts/setup-trust.js
```

---

## 📝 Changements apportés

### `.env` - AVANT (❌ ne fonctionne pas)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/systeme_academique
```

### `.env` - APRÈS (✅ fonctionne!)
```
DATABASE_URL=postgresql://postgres@localhost:5432/systeme_academique
```
**Note:** Pas de mot de passe après `://postgres`, juste `@`

### Docker command - Clé
```bash
-e POSTGRES_HOST_AUTH_METHOD=trust
```

---

## ✅ Vérification
Si tout fonctionne, tu dois voir:
```
[db:ping] Connexion OK { database: 'systeme_academique', role: 'postgres', server_addr: '172.17.0.2' }
```

---

## 🔄 Prochaines étapes
1. ✅ PostgreSQL en Docker fonctionnel → FAIT
2. ⏳ Charger les SQL (partners, students)
3. ⏳ Démarrer l'API Node.js
4. ⏳ Tester le formulaire d'admission

```bash
# Charger les SQL une fois la DB ok
docker exec -i ma-base-postgres psql -U postgres -d systeme_academique < deploy/postgresql/partners_clean.sql
docker exec -i ma-base-postgres psql -U postgres -d systeme_academique < deploy/postgresql/students_admission_clean.sql

# Démarrer les services
npm run dev:server  # Terminal 1
npm run dev         # Terminal 2 (sites)
```

---

**Besoin d'aide?** Exécute et partage l'output de `docker logs ma-base-postgres`
