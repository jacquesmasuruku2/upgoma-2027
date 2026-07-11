# ✅ COPIE-COLLE UNE LIGNE À LA FOIS

## 🚀 Ouvre un NOUVEAU terminal PowerShell (Ctrl+Maj+` ou Ctrl+`)

### Commande 1:
```powershell
cd upgoma-website-main
```
Appuie sur Enter. ✅

---

### Commande 2:
```powershell
docker ps -a
```
Tu devrais voir `ma-base-postgres`. ✅

---

### Commande 3:
```powershell
docker logs ma-base-postgres
```
Regarde la DERNIÈRE ligne. Elle doit dire "ready to accept connections" ou similaire.

**Si tu vois "ready to accept connections" = BON! ✅**

**Si tu vois une erreur = MAUVAIS ❌**

---

### Commande 4 (Le test):
```powershell
node scripts/pg-ping.mjs
```

**Résultat attendu:**
```
[db:ping] Connexion OK { database: 'systeme_academique', role: 'postgres', server_addr: '172.17.0.2' }
```

**Si tu vois ça = C'EST BON! 🎉**

**Si tu vois "authentification failed" ou "connection refused" = Voir ci-dessous**

---

## ❌ Si ça ne marche pas:

Copie-colle **EXACTEMENT** ceci (tout d'un coup):

```powershell
docker stop ma-base-postgres; docker rm ma-base-postgres; docker volume rm postgres_data; docker run -d --name ma-base-postgres --env POSTGRES_PASSWORD=postgres123 --env POSTGRES_DB=systeme_academique -p 5432:5432 postgres:15; Write-Host "Attente..."; Start-Sleep -Seconds 15; Write-Host "Test:"; node scripts/pg-ping.mjs
```

Attends ~20 secondes. 

**Regarde le résultat final.**

---

## 📌 Si TOUJOURS pas de succès:

C'est probablement Docker Desktop qui n'est pas lancé:

1. Ouvre **Docker Desktop** (cherche dans le menu Démarrage)
2. Attends qu'il se lance (~30 secondes)
3. Refais la Commande 4

---

**Dis-moi exactement quel est le message d'erreur que tu reçois!**
