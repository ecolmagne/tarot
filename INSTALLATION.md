# 📦 Installation et Démarrage

## ⚡ Démarrage rapide (serveur complet)

Pour tester immédiatement le jeu avec toutes les fonctionnalités :

```bash
# 1. Installer les dépendances
npm install

# 2. Utiliser le serveur complet (non modulaire)
node server-complete.js
```

Ouvrir http://localhost:3000 dans votre navigateur.

## 🏗️ Version modulaire (en développement)

La version modulaire du serveur est en cours de finalisation. Les fichiers suivants sont prêts :

**✅ Modules utilitaires complets :**
- `server/room-manager.js`
- `server/deck-utils.js`
- `server/game-rules.js`
- `server/score-calculator.js`

**✅ Handlers partiellement complétés :**
- `server/handlers/room-handler.js` (complet)
- `server/handlers/game-handler.js` (complet)

**⚠️ Handlers à compléter :**
- `server/handlers/bidding-handler.js`
- `server/handlers/dog-handler.js`
- `server/handlers/king-call-handler.js`
- `server/handlers/play-handler.js`

Pour compléter la version modulaire, extraire le code pertinent de `server-complete.js` et le placer dans les handlers correspondants.

## 📝 Structure des fichiers

```
tarot-project/
├── server.js              # Point d'entrée serveur modulaire
├── server-complete.js     # Serveur complet fonctionnel ✅
├── server/                # Modules serveur (modulaire)
└── public/
    ├── tarot.html         # Interface
    └── js/                # Modules client ES6 ✅ Complet
```

## 🎯 Client (frontend)

Le client est **100% modulaire et fonctionnel** avec ES6 modules.

Fichiers dans `public/js/` :
- ✅ Tous les modules sont complets et opérationnels
- ✅ Architecture claire et maintenable
- ✅ Documentation complète dans README.md

## 🔄 Migration vers version modulaire serveur

Si vous souhaitez contribuer à la migration modulaire du serveur :

1. Ouvrir `server-complete.js` (code fonctionnel)
2. Identifier une section (ex: gestion des enchères)
3. Extraire le code dans le handler approprié (ex: `bidding-handler.js`)
4. Adapter aux fonctions utilitaires existantes
5. Tester

## 🚀 Production

Pour la production, utilisez `server-complete.js` qui est totalement fonctionnel et testé.

```bash
npm start
# ou
node server-complete.js
```

## 🧪 Tests

Testez avec plusieurs onglets de navigateur ou plusieurs appareils sur le même réseau local.

## 💡 Notes

- Le client (frontend) est déjà modulaire et n'a pas besoin de modifications
- Le serveur modulaire est une amélioration architecturale optionnelle
- Le jeu est pleinement fonctionnel avec `server-complete.js`
