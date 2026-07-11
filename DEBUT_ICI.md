# ✅ SOLUTION COMPLÈTE - À UTILISER MAINTENANT

## 🎯 C'EST PRÊT! Voici ce que tu fais:

### ÉTAPE 1: Ouvre un NOUVEAU terminal PowerShell
```
Appuie sur Ctrl+` pour ouvrir le terminal intégré VS Code
OU
Ouvre PowerShell directement
```

### ÉTAPE 2: Va dans le bon répertoire
```powershell
cd upgoma-website-main
```

### ÉTAPE 3: Copie-colle EXACTEMENT ces commandes (une à la fois)

**Commande 1:**
```powershell
docker stop ma-base-postgres
```

Attends 3 secondes...

**Commande 2:**
```powershell
docker rm ma-base-postgres
```

**Commande 3 - LONGUE (copie-colle d'un coup):**
```powershell
docker run -d --name ma-base-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=UpgAccess123! -e POSTGRES_DB=systeme_academique -p 5432:5432 -v postgres_data:/var/lib/postgresql/data postgres:15
```

Attends que le terminal revienne (affichera un ID long, c'est normal).

**Commande 4: ATTENDRE (obligatoire)**
```powershell
Start-Sleep -Seconds 15
```

**Commande 5: VÉRIFIER**
```powershell
docker ps
```

Tu dois voir une ligne avec `ma-base-postgres` et `Up`. Si c'est bon, continue...

**Commande 6: TESTER LA CONNEXION**
```powershell
node scripts/pg-ping.mjs
```

**✅ SI tu vois:** 
```
[db:ping] Connexion OK { database: 'systeme_academique', role: 'postgres', server_addr: '172.17.0.2' }
```

**🎉 C'EST BON! LE DOCKER FONCTIONNE!**

---

## 📝 CHARGER LES TABLES (optionnel mais recommandé)

**Commande 7a:**
```powershell
Get-Content "deploy/postgresql/partners_clean.sql" -Raw | docker exec -i ma-base-postgres psql -U postgres -d systeme_academique -q
```

**Commande 7b:**
```powershell
Get-Content "deploy/postgresql/students_admission_clean.sql" -Raw | docker exec -i ma-base-postgres psql -U postgres -d systeme_academique -q
```

Si pas d'erreur = bon!

---

## 🚀 LANCER LE PROJET

**Terminal 1 (laisse tourner):**
```powershell
npm run dev:server
```

**Terminal 2 (dans un autre onglet):**
```powershell
npm run dev
```

**Puis:** Ouvre http://localhost:5173

---

## ✅ PROBLÈME?

| Situation | Solution |
|-----------|----------|
| Terminal bloqué | Ctrl+C, puis recommence |
| Connection refused | Attendre 20 secondes |
| Port 5432 en usage | `docker rm -f ma-base-postgres`, recommencer |

---

## 📌 FICHIERS IMPORTANTS

- 📖 **[INDEX_COMPLET.md](INDEX_COMPLET.md)** - Vue d'ensemble
- 📖 **[DEMARRAGE_MANUEL.md](DEMARRAGE_MANUEL.md)** - Exécution détaillée
- 📖 **[DOCKER_POSTGRESQL_SETUP.md](DOCKER_POSTGRESQL_SETUP.md)** - Guide complet

---

## ✨ C'EST TOUT!

Une fois que tu as:
- ✅ `docker ps` affiche `ma-base-postgres Up`
- ✅ `node scripts/pg-ping.mjs` affiche "Connexion OK"
- ✅ `npm run dev:server` fonctionne
- ✅ `npm run dev` fonctionne

**Tu peux maintenant tester le formulaire d'admission et tout le reste en local, puis passer à l'hébergement sur le serveur!**

---

C'est fait! 🎉
