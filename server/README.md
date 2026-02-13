# Architecture Serveur Modulaire - Jeu de Tarot

## 📁 Structure

```
server/
├── room-manager.js
├── deck-utils.js
├── game-rules.js
├── score-calculator.js
├── socket-handlers.js
└── handlers/
    ├── room-handler.js
    ├── game-handler.js
    ├── bidding-handler.js
    ├── dog-handler.js
    ├── king-call-handler.js
    └── play-handler.js
```

## 📦 Modules

**Utilitaires**
- `deck-utils.js` - Cartes
- `game-rules.js` - Règles
- `score-calculator.js` - Scores

**Gestion**
- `room-manager.js` - Salles
- `socket-handlers.js` - Coordination

**Événements**
- `handlers/*.js` - Événements Socket.io

## 🚀 Démarrage

```bash
npm install
node server.js
```
