# ✅ SOLUTION FINALE - Mot de passe corrigé

Le problème venait du **caractère `!`** dans PowerShell qui cause des conflits.

## 🎯 Solution: Mot de passe simple sans caractères spéciaux

### Nouveau mot de passe: `postgres123`
### Mise à jour: `.env` ✅ (déjà fait)

---

## 🚀 Exécute MAINTENANT

### Option 1: Script Batch (RECOMMANDÉ - Plus fiable)
```cmd
scripts\setup-postgres.bat
```

### Option 2: Script PowerShell Simple
```powershell
.\scripts\setup-postgres-simple.ps1
```

### Option 3: Commandes Manuelles (Copie-colle)

Si le terminal PowerShell précédent est bloqué, **ouvre un NOUVEAU terminal**:

```powershell
# Nettoie tout
docker stop ma-base-postgres
docker rm ma-base-postgres
docker volume rm postgres_data

# Crée le container avec le nouveau mot de passe
docker run -d --name ma-base-postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=systeme_academique -p 5432:5432 postgres:15

# Attends 15 secondes
Start-Sleep -Seconds 15

# Teste
node scripts/pg-ping.mjs
```

---

## ✅ Résultat attendu

```
[db:ping] Connexion OK { database: 'systeme_academique', role: 'postgres', server_addr: '172.17.0.2' }
```

**Si tu vois ça = C'est BON! ✅**

---

## 📝 Configuration Finale (.env)

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/systeme_academique
ADMISSION_API_PORT=8787
VITE_ADMISSION_API_BASE=http://localhost:8787
```

✅ Déjà mise à jour!

---

## 🎯 Après Succès

```powershell
npm run dev:server
npm run dev
```

→ http://localhost:5173

---

**Essaie maintenant! 🚀**
