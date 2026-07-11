# 🔍 DIAGNOSTIC ET FIX RAPIDE

## 📊 Étape 1: Vérifier l'état du container

**Ouvre pgAdmin:** http://localhost:5050
- Login: `admin@example.com` / `admin`
- Ajoute un serveur: Host `localhost`, Port `5432`, User `postgres`, Pass `postgres123`

**OU** teste directement dans PowerShell:

```powershell
# Vérifier que le container existe ET fonctionne
docker ps -a

# Devrais voir: ma-base-postgres Up ou Exited
```

---

## 🔧 Si le container est **Exited**:

```powershell
# Redémarrer
docker start ma-base-postgres

# Attendre
Start-Sleep -Seconds 10

# Retester
node scripts/pg-ping.mjs
```

---

## 🔧 Si le container est **Up** mais la connexion échoue:

Vérifie le mot de passe exact:

```powershell
# Lire le .env pour confirmer la DATABASE_URL
Get-Content .env | Select-String "DATABASE_URL"
```

**Dois afficher:**
```
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/systeme_academique
```

Si different, **mettre à jour** le .env avec cette valeur exacte.

---

## 🆘 Si vraiment rien ne marche:

**Option Nucléaire - Recréation complète:**

Ouvre un **NOUVEAU terminal PowerShell** propre (ferme l'ancien):

```powershell
cd upgoma-website-main

# Etape 1: Nettoie TOUT
docker stop ma-base-postgres 2>&1 | Out-Null
docker rm ma-base-postgres 2>&1 | Out-Null
docker volume rm postgres_data 2>&1 | Out-Null

# Etape 2: Crée un NOUVEAU container
docker run -d --name ma-base-postgres --env POSTGRES_PASSWORD=postgres123 --env POSTGRES_DB=systeme_academique -p 5432:5432 postgres:15

# Etape 3: Attendre
for ($i = 1; $i -le 15; $i++) {
  Write-Host "⏳ Attente... ${i}/15 secondes"
  Start-Sleep -Seconds 1
}

# Etape 4: Vérifier
docker ps | Select-String "ma-base-postgres"

# Etape 5: Tester
node scripts/pg-ping.mjs
```

---

## ✅ Si tu vois "Connexion OK":

```powershell
npm run dev:server
npm run dev
```

---

## 📝 Alternative: Utilise juste pgAdmin

Si même après tout ça la connexion CLI ne marche pas, tu peux **utiliser pgAdmin directement**:

1. Ouvre: http://localhost:5050
2. Login: `admin@example.com` / `admin`
3. Add Server:
   - Host: `localhost`
   - Port: `5432`
   - User: `postgres`
   - Password: `postgres123`

Si tu peux te connecter via pgAdmin, le Docker fonctionne! 🎉

---

**Essaie ces étapes et dis-moi où ça bloque exactement!**
