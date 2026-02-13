# 🚀 Guide de Déploiement en Production

## 📋 Table des matières

1. [Préparation](#préparation)
2. [Options de déploiement](#options-de-déploiement)
3. [Render (Recommandé)](#render-recommandé-)
4. [Railway](#railway)
5. [Heroku](#heroku)
6. [VPS (DigitalOcean, AWS, etc.)](#vps-digitalocean-aws-etc)
7. [Configuration du domaine](#configuration-du-domaine)
8. [Optimisations](#optimisations)
9. [Monitoring](#monitoring)

---

## Préparation

### 1. Préparer le projet

**Modifier server.js pour la production :**

```javascript
const PORT = process.env.PORT || 3000;

// Ajouter après la création du serveur
server.listen(PORT, '0.0.0.0', () => {
    console.log('🎴 Serveur Tarot démarré');
    console.log(`🌐 Port: ${PORT}`);
    console.log(`📊 Salles actives : ${rooms.size}`);
});
```

**Créer un fichier `.env.example` :**

```bash
PORT=3000
NODE_ENV=production
```

### 2. Ajouter des scripts npm

**Dans `package.json` :**

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "production": "NODE_ENV=production node server.js"
  }
}
```

### 3. Tester localement en mode production

```bash
npm run production
```

---

## Options de déploiement

| Plateforme | Gratuit | Difficulté | Temps | Recommandé |
|------------|---------|------------|-------|------------|
| **Render** | ✅ Oui | ⭐ Facile | 5 min | ✅ **OUI** |
| **Railway** | ✅ Oui | ⭐ Facile | 5 min | ✅ Oui |
| **Heroku** | ⚠️ Non | ⭐⭐ Moyen | 10 min | ⚠️ Payant |
| **Fly.io** | ✅ Oui | ⭐⭐ Moyen | 10 min | ✅ Oui |
| **VPS** | ❌ Non | ⭐⭐⭐ Difficile | 30+ min | 🏢 Entreprise |

---

## Render (Recommandé ✅)

### Pourquoi Render ?
- ✅ Gratuit pour toujours (avec limitations)
- ✅ HTTPS automatique
- ✅ Déploiement automatique depuis Git
- ✅ Support WebSocket/Socket.io
- ⚠️ Serveur se met en veille après 15 min d'inactivité (plan gratuit)

### Étapes de déploiement

#### 1. Créer un dépôt GitHub

```bash
cd tarot-project
git init
git add .
git commit -m "Initial commit"

# Créer un repo sur github.com puis :
git remote add origin https://github.com/VOTRE_USERNAME/tarot-game.git
git branch -M main
git push -u origin main
```

#### 2. Créer un compte sur Render

👉 Aller sur [render.com](https://render.com) et créer un compte (gratuit)

#### 3. Créer un nouveau Web Service

1. Cliquer sur **"New +"** → **"Web Service"**
2. Connecter votre repo GitHub
3. Sélectionner votre dépôt `tarot-game`

#### 4. Configuration

```
Name: tarot-game
Region: Frankfurt (ou le plus proche)
Branch: main
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

#### 5. Variables d'environnement (optionnel)

Dans la section "Environment" :
```
NODE_ENV=production
```

#### 6. Déployer

Cliquer sur **"Create Web Service"**

⏳ Le déploiement prend 2-3 minutes

✅ Votre jeu sera accessible sur : `https://tarot-game-xxxx.onrender.com`

### ⚠️ Limitation du plan gratuit

Le serveur se met en veille après 15 minutes d'inactivité. Le premier accès prendra 30-60 secondes pour "réveiller" le serveur.

**Solutions :**
- Passer au plan payant ($7/mois) pour éviter la veille
- Utiliser un service de ping (UptimeRobot) pour garder le serveur actif

---

## Railway

### Pourquoi Railway ?
- ✅ Gratuit ($5 de crédit/mois)
- ✅ Pas de mise en veille
- ✅ Très simple
- ✅ HTTPS automatique

### Étapes de déploiement

#### 1. Créer un compte

👉 [railway.app](https://railway.app)

#### 2. Nouveau projet

1. Cliquer sur **"New Project"**
2. Choisir **"Deploy from GitHub repo"**
3. Connecter GitHub et sélectionner votre repo

#### 3. Configuration automatique

Railway détecte automatiquement Node.js !

#### 4. Accéder au site

1. Aller dans **"Settings"**
2. Section **"Networking"** → **"Generate Domain"**

✅ Votre jeu est en ligne : `https://tarot-game.up.railway.app`

---

## Heroku

### ⚠️ Heroku n'est plus gratuit depuis 2022

Plan minimum : $7/mois

### Si vous avez un plan payant

#### 1. Installer Heroku CLI

```bash
# Mac
brew install heroku/brew/heroku

# Windows
# Télécharger depuis heroku.com

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

#### 2. Se connecter

```bash
heroku login
```

#### 3. Créer l'application

```bash
cd tarot-project
heroku create tarot-game-unique-name
```

#### 4. Déployer

```bash
git push heroku main
```

#### 5. Ouvrir

```bash
heroku open
```

✅ Accessible sur : `https://tarot-game-unique-name.herokuapp.com`

---

## VPS (DigitalOcean, AWS, etc.)

### Pour qui ?
- 🏢 Production sérieuse
- 💰 Budget disponible (~$5-10/mois)
- 🔧 Connaissances techniques requises

### Exemple avec DigitalOcean

#### 1. Créer un Droplet

- OS : Ubuntu 22.04
- Plan : Basic ($6/mois)
- Datacenter : Le plus proche

#### 2. Se connecter en SSH

```bash
ssh root@VOTRE_IP
```

#### 3. Installer Node.js

```bash
# Installer Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PM2 (gestionnaire de processus)
sudo npm install -g pm2
```

#### 4. Installer Nginx

```bash
sudo apt update
sudo apt install nginx
```

#### 5. Déployer l'application

```bash
# Cloner le projet
cd /var/www
git clone https://github.com/VOTRE_USERNAME/tarot-game.git
cd tarot-game

# Installer les dépendances
npm install --production

# Démarrer avec PM2
pm2 start server.js --name tarot-game
pm2 startup
pm2 save
```

#### 6. Configurer Nginx

```bash
sudo nano /etc/nginx/sites-available/tarot-game
```

**Contenu :**

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Support WebSocket
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Activer le site :**

```bash
sudo ln -s /etc/nginx/sites-available/tarot-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Installer SSL (HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

✅ Votre site est accessible en HTTPS !

---

## Configuration du domaine

### Acheter un domaine

- **Namecheap** : ~$10/an
- **OVH** : ~$8/an
- **Google Domains** : ~$12/an

### Configurer les DNS

#### Pour Render/Railway/Heroku

1. Aller dans les paramètres DNS de votre domaine
2. Ajouter un enregistrement CNAME :

```
Type: CNAME
Name: @  (ou www)
Value: votre-app.onrender.com
```

3. Attendre 10-30 minutes pour la propagation

#### Pour VPS

1. Ajouter un enregistrement A :

```
Type: A
Name: @
Value: VOTRE_IP_VPS
```

---

## Optimisations

### 1. Compression Gzip

**Ajouter dans server.js :**

```javascript
const compression = require('compression');
app.use(compression());
```

**Installer :**

```bash
npm install compression
```

### 2. Rate limiting

**Protéger contre les abus :**

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limite de 100 requêtes par IP
});

app.use(limiter);
```

**Installer :**

```bash
npm install express-rate-limit
```

### 3. Variables d'environnement

**Créer `.env` :**

```bash
PORT=3000
NODE_ENV=production
MAX_ROOMS=100
```

**Utiliser dotenv :**

```bash
npm install dotenv
```

**Dans server.js :**

```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

### 4. Logging

```bash
npm install winston
```

**Créer logger.js :**

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger;
```

---

## Monitoring

### 1. UptimeRobot (Gratuit)

👉 [uptimerobot.com](https://uptimerobot.com)

- Surveiller la disponibilité
- Recevoir des alertes par email/SMS
- Garder le serveur actif (ping toutes les 5 min)

### 2. PM2 Monitoring

```bash
pm2 install pm2-logrotate
pm2 monit
```

### 3. Logs en production

**Voir les logs sur Render :**
- Aller dans votre service
- Onglet "Logs"

**Sur VPS avec PM2 :**

```bash
pm2 logs tarot-game
pm2 logs tarot-game --lines 100
```

---

## Checklist de déploiement

- [ ] Tests locaux en mode production
- [ ] Git repo créé et pushé
- [ ] Plateforme choisie (Render/Railway/VPS)
- [ ] Application déployée
- [ ] HTTPS activé
- [ ] Domaine configuré (optionnel)
- [ ] Compression activée
- [ ] Rate limiting configuré
- [ ] Monitoring en place
- [ ] Logs configurés
- [ ] Tests complets (3, 4, 5 joueurs)

---

## Coûts estimés

### Option gratuite
- **Render Free** : $0/mois (avec limitations)
- **Railway** : $0/mois (avec $5 de crédit)
- **Domaine** : ~$10/an (optionnel)
- **Total** : ~$1/mois

### Option premium
- **Render Standard** : $7/mois
- **Railway Pro** : $5/mois
- **VPS DigitalOcean** : $6/mois
- **Domaine** : ~$10/an
- **Total** : ~$6-8/mois

---

## 🎉 Recommandation finale

**Pour commencer :** 
👉 **Render (gratuit)** - Parfait pour tester et partager

**Pour production sérieuse :**
👉 **Railway ($5/mois)** ou **VPS ($6/mois)** - Pas de mise en veille, meilleures performances

**Avec un domaine personnalisé, votre jeu sera accessible :**
```
https://tarot.votredomaine.com
```

Bonne chance avec votre déploiement ! 🚀🃏
