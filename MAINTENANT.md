# ✅ DÉMARRAGE MAINTENANT

## 🎯 Mot de passe corrigé: `postgres123`

Le mot de passe `UpgAccess123!` avec `!` cause des problèmes en PowerShell.

---

## 🚀 Choisis UNE de ces 3 options:

### **Option 1: Script Node.js (Recommandé - Plus fiable)**

```powershell
node scripts/setup-postgres.js
```

### **Option 2: Script Batch Windows**

```cmd
scripts\setup-postgres.bat
```

### **Option 3: Script PowerShell Simple**

```powershell
.\scripts\setup-postgres-simple.ps1
```

---

## ⏱️ Durée: ~20 secondes

Le script va:
1. ✅ Arrêter le container existant
2. ✅ Supprimer le volume ancien
3. ✅ Créer un nouveau container
4. ✅ Attendre le démarrage
5. ✅ Tester la connexion

---

## ✅ Résultat attendu

```
[db:ping] Connexion OK { database: 'systeme_academique', role: 'postgres', server_addr: '172.17.0.2' }
```

---

## 📝 Configuration

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/systeme_academique
```

✅ Déjà mise à jour dans `.env`

---

## 🎯 Après Succès

```powershell
npm run dev:server    # Terminal 1
npm run dev           # Terminal 2
```

→ http://localhost:5173

---

**Exécute maintenant! 🚀**
