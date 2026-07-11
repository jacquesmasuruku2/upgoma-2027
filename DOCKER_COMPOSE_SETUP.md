# 🚀 SETUP COMPLET - Docker Compose (Solution définitive)

## Pourquoi Docker Compose?
- ✅ PostgreSQL + Node.js dans le même réseau Docker
- ✅ Pas de problèmes TCP/Socket d'authentification
- ✅ Les SQL sont chargées automatiquement au démarrage
- ✅ Fonctionne localement ET sur le serveur (Hetzner)
- ✅ Une commande = tout démarre

## 🔧 Setup (une seule fois)

### Étape 1: Nettoyer l'ancien container
```powershell
docker stop ma-base-postgres 2>$null
docker rm ma-base-postgres 2>$null
docker volume prune -f
```

### Étape 2: Lancer Docker Compose
```powershell
docker-compose up -d
```

**Attends 10-15 secondes** que PostgreSQL s'initialise complètement...

### Étape 3: Vérifier que tout fonctionne
```powershell
# Test 1: Base de données accessible?
docker-compose exec postgres psql -U postgres -d systeme_academique -c "SELECT 1;"

# Test 2: Node.js peut se connecter?
node scripts/pg-ping-simple.mjs

# Test 3: Les tables sont créées?
docker-compose exec postgres psql -U postgres -d systeme_academique -c "\dt"
```

---

## 🎮 Commandes quotidiennes

### Démarrer le stack
```powershell
docker-compose up -d
```

### Arrêter
```powershell
docker-compose down
```

### Voir les logs
```powershell
docker-compose logs -f
```

### Tester la connexion DB
```powershell
node scripts/pg-ping-simple.mjs
```

### Accéder directement à PostgreSQL
```powershell
docker-compose exec postgres psql -U postgres -d systeme_academique
```

---

## 📝 Fichiers créés/modifiés

1. `docker-compose.yml` - Orches trateur des containers
2. `Dockerfile.dev` - Image Node.js développement
3. `.env` - Variables d'environnement (DATABASE_URL)
4. `scripts/pg-ping-simple.mjs` - Test simple

---

## 🔌 URLs de connexion

**Depuis l'hôte (localhost):**
```
postgresql://postgres:postgres@localhost:5432/systeme_academique
```

**Depuis Docker (Node.js):**
```
postgresql://postgres:postgres@postgres:5432/systeme_academique
```

**Note:** Dans `docker-compose.yml`, le service s'appelle `postgres`, donc c'est le hostname utilisé dans le réseau Docker.

---

## ✅ Prochaines étapes après setup

1. ✅ Démarrer: `docker-compose up -d`
2. ✅ Tester DB: `node scripts/pg-ping-simple.mjs`
3. ⏳ Lancer l'API: `npm run dev:server`
4. ⏳ Lancer le site: `npm run dev`
5. ⏳ Tester le formulaire: http://localhost:5173/admission

---

**Exécute les commandes de l'étape 1, puis partage l'output!**
