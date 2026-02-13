# 🎴 Jeu de Tarot Multijoueur

Application web complète de Tarot français pour 3, 4 ou 5 joueurs.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur
npm start

# Mode développement (avec nodemon)
npm run dev
```

Le serveur démarre sur http://localhost:3000

## ✨ Fonctionnalités

- **Multijoueur en temps réel** avec Socket.io
- **3, 4 ou 5 joueurs** supportés
- **Règles complètes du Tarot français** :
  - Enchères (Petite, Garde, Garde sans, Garde contre)
  - Chien et écart
  - Appel de Roi (5 joueurs)
  - Obligation de fournir, couper, monter
  - Petit au bout
  - Scoring officiel

## 📁 Structure du projet

```
tarot-project/
├── server.js                    # Point d'entrée serveur
├── package.json                 # Dépendances
├── server/                      # Modules serveur
│   ├── room-manager.js
│   ├── deck-utils.js
│   ├── game-rules.js
│   ├── score-calculator.js
│   ├── socket-handlers.js
│   └── handlers/                # Gestionnaires d'événements
└── public/                      # Fichiers client
    ├── tarot.html              # Interface HTML
    └── js/                      # Modules client ES6
        ├── tarot-client.js
        ├── state.js
        ├── socket-handler.js
        ├── ui-handler.js
        ├── bidding-handler.js
        ├── dog-handler.js
        ├── king-call-handler.js
        ├── game-handler.js
        └── card-utils.js
```

## 🎮 Comment jouer

1. Créer une partie et choisir le nombre de joueurs
2. Partager le code de partie avec les autres joueurs
3. Une fois tous connectés, l'hôte démarre la partie
4. Suivre les phases : enchères → chien → appel de Roi → jeu

## 🛠️ Architecture

**Serveur (Node.js + Express + Socket.io)**
- Architecture modulaire
- Gestion des salles
- Validation des règles
- Calcul des scores

**Client (Vanilla JavaScript ES6 Modules)**
- Architecture modulaire
- Interface responsive
- Communication temps réel

## 📝 Règles implémentées

- ✅ Distribution correcte selon le nombre de joueurs
- ✅ Enchères avec surenchère obligatoire
- ✅ Garde contre arrête les enchères
- ✅ Chien visible par tous après enchères
- ✅ Écart avec validation (pas de Rois, atouts seulement avec Excuse)
- ✅ Appel de Roi à 5 joueurs (avant le chien)
- ✅ Roi appelé interdit au 1er pli
- ✅ Obligation de fournir la couleur
- ✅ Obligation de couper
- ✅ Obligation de monter à l'atout
- ✅ L'Excuse reste à l'équipe qui l'a jouée
- ✅ Petit au bout (10 points bonus)
- ✅ Scoring par équipe
- ✅ Multiplicateurs de contrats

## 🐛 Debug

L'état du jeu est accessible dans la console :
```javascript
// Client
console.log(window.tarotState);

// Serveur
const { getAllRooms } = require('./server/room-manager');
console.log(getAllRooms());
```

## 📄 License

MIT

## 👨‍💻 Développement

Le projet utilise une architecture modulaire pour faciliter la maintenance et l'évolution. Voir les README dans `server/` et `public/js/` pour plus de détails.
