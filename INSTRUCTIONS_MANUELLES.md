# ============================================
# EXÉCUTION MANUELLE - Copie/Colle Directe
# ============================================

## ⚠️ Si le terminal PowerShell est bloqué:
# Appuie sur Ctrl+C pour quitter, puis relance une nouvelle session

# ============================================
# ÉTAPE 1: Arrête le container existant
# ============================================
docker stop ma-base-postgres

# Attends 2 secondes
# Puis continue...

# ============================================
# ÉTAPE 2: Supprime le container existant
# ============================================
docker rm ma-base-postgres

# ============================================
# ÉTAPE 3: Crée un nouveau container
# ============================================
docker run -d `
  --name ma-base-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=UpgAccess123! `
  -e POSTGRES_DB=systeme_academique `
  -p 5432:5432 `
  -v postgres_data:/var/lib/postgresql/data `
  postgres:15

# ============================================
# ÉTAPE 4: Attendre 15 secondes
# ============================================
# Laisse le container démarrer complètement
Start-Sleep -Seconds 15

# ============================================
# ÉTAPE 5: Vérifier le container
# ============================================
docker ps

# ✅ Doit afficher: ma-base-postgres Up ...

# ============================================
# ÉTAPE 6: Tester la connexion
# ============================================
node scripts/pg-ping.mjs

# ✅ Résultat attendu: [db:ping] Connexion OK { ... }

# ============================================
# ÉTAPE 7: Charger les fichiers SQL (optionnel)
# ============================================

# Pour charger partners_clean.sql:
$sqlContent = Get-Content "deploy/postgresql/partners_clean.sql" -Raw
$sqlContent | docker exec -i ma-base-postgres psql -U postgres -d systeme_academique -q

# Pour charger students_admission_clean.sql:
$sqlContent = Get-Content "deploy/postgresql/students_admission_clean.sql" -Raw
$sqlContent | docker exec -i ma-base-postgres psql -U postgres -d systeme_academique -q

# ============================================
# ÉTAPE 8: Vérifier les tables
# ============================================
$env:PGPASSWORD = "UpgAccess123!"
psql -h localhost -U postgres -d systeme_academique -c "\dt"

# ✅ Doit afficher: 
#   partners
#   partnership_requests
#   students

# ============================================
# SUCCÈS! 🎉
# ============================================
# Tu peux maintenant:
# 1. npm run dev:server
# 2. npm run dev
# 3. Tester http://localhost:5173/admission
