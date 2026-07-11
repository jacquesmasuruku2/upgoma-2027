# ⚠️ SOLUTION FINALE - Approche différente

Si les mots de passe ne fonctionnent pas, essayons **SANS mot de passe** avec authentification "trust".

## 🚀 Copie-colle dans PowerShell:

### Commande 1:
```powershell
docker stop ma-base-postgres 2>$null; docker rm ma-base-postgres 2>$null; docker volume prune -f 2>$null
```

### Commande 2 (Attendre que le prompt revienne, ~3 secondes)

### Commande 3:
```powershell
docker run -d --name ma-base-postgres -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=systeme_academique -p 5432:5432 postgres:15
```

(Attends que tu reçoives un ID long)

### Commande 4:
```powershell
Start-Sleep -Seconds 20
```

### Commande 5:
```powershell
docker exec ma-base-postgres psql -U postgres -d systeme_academique -c "SELECT 1;"
```

**Devrait répondre:**
```
 ?column? 
----------
        1
(1 row)
```

### Commande 6:
```powershell
# Mettre à jour le .env sans mot de passe
@"
# Supabase (optionnel pour le site)
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# PostgreSQL local en Docker - SANS MOT DE PASSE
DATABASE_URL=postgresql://postgres@localhost:5432/systeme_academique

# API admission (Node.js)
ADMISSION_API_PORT=8787
VITE_ADMISSION_API_BASE=http://localhost:8787
"@ | Out-File .env -Encoding UTF8
```

### Commande 7:
```powershell
node scripts/pg-ping.mjs
```

**Résultat attendu:**
```
[db:ping] Connexion OK { database: 'systeme_academique', role: 'postgres', server_addr: '172.17.0.2' }
```

---

## 💡 Explication

L'authentification **"trust"** signifie que PostgreSQL fait confiance à la machine locale et n'exige pas de mot de passe. Cela fonctionne parfaitement pour le développement local.

---

**Essaie ça et dis-moi le résultat!**
