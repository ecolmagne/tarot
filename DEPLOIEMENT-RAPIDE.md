# ⚡ Déploiement Rapide - 5 Minutes

## 🎯 Option 1 : Render (Le plus simple)

### 1. Créer un compte GitHub

Si vous n'en avez pas : [github.com](https://github.com)

### 2. Pousser votre code sur GitHub

```bash
cd tarot-project

# Initialiser Git
git init
git add .
git commit -m "Initial commit"

# Créer un nouveau repo sur github.com puis :
git remote add origin https://github.com/VOTRE_USERNAME/tarot-game.git
git branch -M main
git push -u origin main
```

### 3. Déployer sur Render

1. **Créer un compte** sur [render.com](https://render.com) (gratuit)

2. **Nouveau Web Service**
   - Cliquer sur "New +" → "Web Service"
   - Connecter GitHub
   - Sélectionner votre repo `tarot-game`

3. **Configuration**
   ```
   Name: tarot-game
   Region: Frankfurt
   Branch: main
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

4. **Créer le service**

⏳ Attendez 2-3 minutes...

✅ **C'est en ligne !** → `https://tarot-game-xxxx.onrender.com`

---

## 🎯 Option 2 : Railway (Recommandé)

### 1. Pousser sur GitHub (même étapes que ci-dessus)

### 2. Déployer sur Railway

1. **Créer un compte** sur [railway.app](https://railway.app)

2. **Nouveau projet**
   - Cliquer sur "New Project"
   - Choisir "Deploy from GitHub repo"
   - Sélectionner votre repo

3. **Générer un domaine**
   - Aller dans "Settings"
   - Section "Networking"
   - Cliquer "Generate Domain"

✅ **C'est en ligne !** → `https://tarot-game.up.railway.app`

---

## 🎯 Option 3 : Docker (Local ou VPS)

### Prérequis
- Docker installé

### Déploiement

```bash
cd tarot-project

# Construire l'image
docker build -t tarot-game .

# Démarrer le conteneur
docker run -d -p 3000:3000 --name tarot tarot-game

# Ou utiliser docker-compose
docker-compose up -d
```

✅ **Accessible sur** → `http://localhost:3000`

---

## 📊 Comparaison rapide

| Plateforme | Temps | Gratuit | Veille | HTTPS |
|------------|-------|---------|--------|-------|
| **Render** | 5 min | ✅ Oui | ⚠️ Oui (15 min) | ✅ Auto |
| **Railway** | 3 min | ✅ $5/mois | ✅ Non | ✅ Auto |
| **Docker** | 2 min | ✅ Oui | ✅ Non | ❌ Manuel |

---

## ⚠️ Note importante sur Render (plan gratuit)

Le serveur se met en veille après 15 minutes d'inactivité.
Premier accès = 30-60 secondes de chargement.

**Solutions :**
1. Passer au plan payant ($7/mois)
2. Utiliser [UptimeRobot](https://uptimerobot.com) pour garder actif (gratuit)
3. Utiliser Railway à la place

---

## 🔧 Configuration post-déploiement

### Activer UptimeRobot (Render uniquement)

1. Créer un compte sur [uptimerobot.com](https://uptimerobot.com)
2. Ajouter un nouveau monitor :
   - Type : HTTP(s)
   - URL : Votre URL Render
   - Intervalle : 5 minutes
3. ✅ Votre serveur restera actif !

### Tester votre déploiement

1. Ouvrir l'URL de votre application
2. Créer une partie à 3 joueurs
3. Ouvrir 2 autres onglets et rejoindre
4. Démarrer et jouer une partie complète

✅ Si tout fonctionne, c'est bon !

---

## 🎉 Votre jeu est en ligne !

**Prochaines étapes :**
- [ ] Partager l'URL avec vos amis
- [ ] Configurer un domaine personnalisé (optionnel)
- [ ] Activer le monitoring
- [ ] Profiter du jeu ! 🃏

**Besoin d'aide ?**
- Voir `DEPLOIEMENT-PRODUCTION.md` pour plus de détails
- Problèmes ? Vérifier les logs de la plateforme
