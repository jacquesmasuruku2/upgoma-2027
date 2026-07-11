# 🚀 DÉMARRAGE RAPIDE - Sans Scripts

Le terminal PowerShell semble avoir des problèmes. Voici la **solution directe** en copiant-collant les commandes une par une.

## ✅ Option 1: Exécution Directe (RECOMMANDÉE)

### Étape 1: Ouvre un **NOUVEAU** terminal PowerShell

```powershell
# Change de répertoire
cd upgoma-website-main
```

### Étape 2: Arrête le container existant

```powershell
docker stop ma-base-postgres
```

Attends que le prompt revienne (2-3 secondes).

### Étape 3: Supprime le container

```powershell
docker rm ma-base-postgres
```

### Étape 4: Crée un nouveau container

Copie-colle EXACTEMENT cette ligne:

```powershell
docker run -d --name ma-base-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=UpgAccess123! -e POSTGRES_DB=systeme_academique -p 5432:5432 -v postgres_data:/var/lib/postgresql/data postgres:15
```

Le terminal affichera un ID. C'est bon!

### Étape 5: Attendre le démarrage

```powershell
Start-Sleep -Seconds 15
```

### Étape 6: Vérifier le container

```powershell
docker ps
```

**✅ Résultat attendu:** Tu vois une ligne avec `ma-base-postgres` et `Up`

### Étape 7: Tester la connexion

```powershell
node scripts/pg-ping.mjs
```

**✅ Résultat attendu:** 
```
[db:ping] Connexion OK { database: 'systeme_academique', role: 'postgres', server_addr: '172.17.0.2' }
```

### Étape 8: Charger les fichiers SQL (optionnel)

Copie-colle cette ligne pour charger partners_clean.sql:

```powershell
Get-Content "deploy/postgresql/partners_clean.sql" -Raw | docker exec -i ma-base-postgres psql -U postgres -d systeme_academique -q
```

Puis copie-colle cette ligne pour charger students_admission_clean.sql:

```powershell
Get-Content "deploy/postgresql/students_admission_clean.sql" -Raw | docker exec -i ma-base-postgres psql -U postgres -d systeme_academique -q
```

### Étape 9: Vérifier les tables (optionnel)

```powershell
$env:PGPASSWORD = "UpgAccess123!"
psql -h localhost -U postgres -d systeme_academique -c "\dt"
```

**✅ Résultat attendu:** Voir les tables `partners`, `partnership_requests`, `students`

---

## ✅ Option 2: Utiliser le Script Simple

Si tu veux utiliser un script:

```powershell
cd upgoma-website-main
.\scripts\run-test.ps1
```

---

## ✅ Option 3: Utiliser le Batch Script

```cmd
cd upgoma-website-main
scripts\test-docker-postgres.bat
```

---

## ✅ APRÈS SUCCÈS

Une fois que le container fonctionne et que `node scripts/pg-ping.mjs` affiche "Connexion OK":

```powershell
# Lancer l'API admission
npm run dev:server

# Dans un autre terminal:
# Lancer le site
npm run dev

# Ensuite:
# http://localhost:5173
```

---

## 💡 Troubleshooting Rapide

| Erreur | Solution |
|--------|----------|
| `Connection refused` | Attendre 15-20 secondes après création du container |
| `Authentication failed` | Vérifier le mot de passe: `UpgAccess123!` |
| `Port 5432 already in use` | `docker rm -f ma-base-postgres` puis recommencer |
| Terminal bloqué | Appuyer sur `Ctrl+C` pour quitter |

---

## 📝 Commandes Utiles

```powershell
# Voir les logs du container
docker logs ma-base-postgres

# Accéder au container directement
docker exec -it ma-base-postgres psql -U postgres

# Vérifier la taille du container
docker ps -s | grep ma-base-postgres

# Nettoyer tous les volumes Docker
docker volume prune

# Voir l'usage CPU/mémoire
docker stats ma-base-postgres
```

---

**C'est tout! L'exécution manuelle évite tous les problèmes PowerShell.** ✅
