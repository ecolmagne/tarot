# 🌐 Déploiement avec Apache

## Oui, Apache fonctionne parfaitement ! ✅

Apache peut servir de reverse proxy pour votre application Node.js, exactement comme Nginx.

---

## 📋 Différences Apache vs Nginx

| Critère | Apache | Nginx |
|---------|--------|-------|
| **Performance** | Bon | Excellent |
| **Connexions simultanées** | Limité | Très élevé |
| **Configuration** | Plus verbeux | Plus concis |
| **Modules** | Très nombreux | Essentiels |
| **Popularité VPS** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Pour ce projet** | ✅ Parfait | ✅ Parfait |

**Verdict pour Tarot :** Les deux fonctionnent très bien ! Choisissez celui que vous connaissez.

---

## 🚀 Installation et Configuration avec Apache

### Prérequis

Vous avez besoin d'un serveur VPS (DigitalOcean, AWS, etc.) avec Ubuntu.

---

## 📦 Installation complète

### 1. Connexion au serveur

```bash
ssh root@VOTRE_IP
```

### 2. Installer Node.js

```bash
# Installer Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

### 3. Installer PM2 (Gestionnaire de processus)

```bash
sudo npm install -g pm2
```

### 4. Installer Apache

```bash
# Mettre à jour les packages
sudo apt update

# Installer Apache
sudo apt install apache2

# Vérifier qu'Apache fonctionne
sudo systemctl status apache2
```

### 5. Activer les modules nécessaires

```bash
# Activer les modules pour le proxy et WebSocket
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod ssl
sudo a2enmod deflate

# Redémarrer Apache
sudo systemctl restart apache2
```

---

## 📝 Configuration du site

### 6. Déployer votre application

```bash
# Aller dans le dossier web
cd /var/www

# Cloner votre projet
git clone https://github.com/VOTRE_USERNAME/tarot-game.git
cd tarot-game

# Installer les dépendances
npm install --production

# Démarrer avec PM2
pm2 start server.js --name tarot-game
pm2 startup
pm2 save
```

### 7. Créer la configuration Apache

```bash
# Créer le fichier de configuration
sudo nano /etc/apache2/sites-available/tarot-game.conf
```

**Coller cette configuration :**

```apache
<VirtualHost *:80>
    ServerName votre-domaine.com
    ServerAlias www.votre-domaine.com
    ServerAdmin admin@votre-domaine.com

    # Logs
    ErrorLog ${APACHE_LOG_DIR}/tarot-game-error.log
    CustomLog ${APACHE_LOG_DIR}/tarot-game-access.log combined

    # Proxy pour Node.js
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # Support WebSocket pour Socket.io
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:3000/$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*)           http://localhost:3000/$1 [P,L]

    # Headers de proxy
    <Proxy *>
        Order deny,allow
        Allow from all
    </Proxy>

    # Compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
    </IfModule>
</VirtualHost>
```

**Sauvegarder et quitter :** `Ctrl+X`, puis `Y`, puis `Entrée`

### 8. Activer le site

```bash
# Désactiver le site par défaut
sudo a2dissite 000-default.conf

# Activer votre site
sudo a2ensite tarot-game.conf

# Tester la configuration
sudo apache2ctl configtest

# Si "Syntax OK", redémarrer Apache
sudo systemctl restart apache2
```

---

## 🔒 Installation SSL (HTTPS)

### 9. Installer Certbot

```bash
# Installer Certbot pour Apache
sudo apt install certbot python3-certbot-apache
```

### 10. Obtenir un certificat SSL

```bash
# Remplacer par votre domaine
sudo certbot --apache -d votre-domaine.com -d www.votre-domaine.com
```

**Certbot va :**
1. Obtenir un certificat SSL gratuit
2. Modifier automatiquement votre configuration Apache
3. Configurer le renouvellement automatique

**Répondre aux questions :**
- Email : Votre email
- Termes : Accepter (A)
- Redirection HTTPS : Oui (2)

✅ **Votre site est maintenant en HTTPS !**

### 11. Tester le renouvellement automatique

```bash
# Tester le renouvellement (rien ne sera vraiment renouvelé)
sudo certbot renew --dry-run
```

---

## 🔧 Gestion de l'application

### Commandes PM2 utiles

```bash
# Voir le statut
pm2 status

# Voir les logs
pm2 logs tarot-game

# Redémarrer
pm2 restart tarot-game

# Arrêter
pm2 stop tarot-game

# Supprimer
pm2 delete tarot-game
```

### Commandes Apache utiles

```bash
# Redémarrer Apache
sudo systemctl restart apache2

# Recharger la config (sans coupure)
sudo systemctl reload apache2

# Voir les logs d'erreur
sudo tail -f /var/log/apache2/tarot-game-error.log

# Voir les logs d'accès
sudo tail -f /var/log/apache2/tarot-game-access.log

# Tester la configuration
sudo apache2ctl configtest

# Voir le statut
sudo systemctl status apache2
```

---

## 🔥 Pare-feu (UFW)

```bash
# Autoriser Apache
sudo ufw allow 'Apache Full'

# Autoriser SSH
sudo ufw allow OpenSSH

# Activer le pare-feu
sudo ufw enable

# Vérifier
sudo ufw status
```

---

## 📊 Optimisations Apache

### Limiter les connexions (Anti-DDoS basique)

```bash
sudo nano /etc/apache2/mods-available/reqtimeout.conf
```

**Ajouter :**

```apache
<IfModule reqtimeout_module>
  RequestReadTimeout header=20-40,MinRate=500 body=20,MinRate=500
</IfModule>
```

### Activer la compression

```bash
# Déjà activé avec mod_deflate dans la config
sudo a2enmod deflate
sudo systemctl restart apache2
```

---

## 🚨 Dépannage

### Problème : Apache ne démarre pas

```bash
# Voir les erreurs
sudo systemctl status apache2
sudo journalctl -xe
```

**Solutions courantes :**
- Port 80 déjà utilisé → `sudo lsof -i :80`
- Erreur de syntaxe → `sudo apache2ctl configtest`

### Problème : WebSocket ne fonctionne pas

```bash
# Vérifier que les modules sont activés
sudo apache2ctl -M | grep proxy
sudo apache2ctl -M | grep rewrite
```

**Vous devez voir :**
- proxy_module
- proxy_http_module
- proxy_wstunnel_module
- rewrite_module

**Si manquant :**

```bash
sudo a2enmod proxy_wstunnel
sudo systemctl restart apache2
```

### Problème : Erreur 502 Bad Gateway

```bash
# Vérifier que Node.js tourne
pm2 status

# Redémarrer l'application
pm2 restart tarot-game

# Vérifier les logs
pm2 logs tarot-game
```

### Problème : SSL ne fonctionne pas

```bash
# Vérifier les certificats
sudo certbot certificates

# Renouveler manuellement
sudo certbot renew --force-renewal
```

---

## 📈 Monitoring avec Apache

### Activer le module status

```bash
sudo a2enmod status
```

**Ajouter à `/etc/apache2/mods-available/status.conf` :**

```apache
<Location "/server-status">
    SetHandler server-status
    Require local
</Location>
```

**Accès : ** `http://VOTRE_IP/server-status`

---

## ⚖️ Apache vs Nginx - Quand utiliser quoi ?

### Utilisez Apache si :
✅ Vous connaissez déjà Apache  
✅ Vous avez besoin de .htaccess  
✅ Vous utilisez d'autres modules Apache  
✅ Votre hébergeur utilise cPanel (Apache par défaut)

### Utilisez Nginx si :
✅ Nouvelles installations  
✅ Performances maximales souhaitées  
✅ Beaucoup de connexions simultanées  
✅ Configuration simple préférée

### Pour ce projet Tarot :
**Les deux fonctionnent parfaitement !** ✅  
Choisissez celui que vous maîtrisez le mieux.

---

## 📋 Checklist de déploiement Apache

- [ ] VPS créé (Ubuntu 22.04)
- [ ] Node.js installé
- [ ] PM2 installé
- [ ] Apache installé
- [ ] Modules Apache activés
- [ ] Application déployée
- [ ] PM2 démarré
- [ ] Configuration Apache créée
- [ ] Site activé
- [ ] Apache redémarré
- [ ] Tests : Application accessible
- [ ] Certbot installé
- [ ] SSL configuré
- [ ] Tests : HTTPS fonctionne
- [ ] Pare-feu configuré
- [ ] WebSocket testé (créer une partie)

---

## 🎉 Résultat final

Votre application sera accessible sur :

**HTTP :** `http://votre-domaine.com`  
**HTTPS :** `https://votre-domaine.com` ✅

**Avec :**
- ✅ Reverse proxy Apache
- ✅ Support WebSocket/Socket.io
- ✅ SSL/HTTPS automatique
- ✅ Compression activée
- ✅ Logs configurés
- ✅ Auto-restart avec PM2

---

## 💡 Conseil final

**Apache fonctionne très bien pour ce projet !**

Si vous êtes déjà familier avec Apache, n'hésitez pas à l'utiliser. La configuration fournie est optimisée pour votre jeu de Tarot et gère parfaitement :

- WebSocket (Socket.io)
- Connexions simultanées multiples
- SSL/HTTPS
- Compression
- Logs

**Les performances seront excellentes pour un jeu de Tarot ! 🃏**

---

## 📚 Fichiers fournis

Le projet inclut maintenant :
- ✅ `apache.conf` - Configuration Apache complète
- ✅ `nginx.conf` - Configuration Nginx (alternative)
- ✅ Ce guide - Instructions détaillées

**Choisissez celui que vous préférez !**
