# Architecture Modulaire du Jeu de Tarot

## 📁 Structure des fichiers

```
public/
└── js/
    ├── tarot-client.js       # Point d'entrée principal
    ├── state.js              # Gestion de l'état global
    ├── socket-handler.js     # Communication Socket.io
    ├── ui-handler.js         # Interface utilisateur
    ├── bidding-handler.js    # Gestion des enchères
    ├── dog-handler.js        # Gestion du chien et de l'écart
    ├── king-call-handler.js  # Appel de Roi (5 joueurs)
    ├── game-handler.js       # Logique du jeu (plis, cartes)
    └── card-utils.js         # Utilitaires pour les cartes
```

## 📦 Description des modules

### `tarot-client.js`
Point d'entrée de l'application. Initialise tous les modules et coordonne l'application.

### `state.js`
Gère l'état global de l'application :
- Informations du joueur
- État de la partie
- Main du joueur
- Cartes jouées
- Enchères en cours

### `socket-handler.js`
Gère la communication avec le serveur via Socket.io :
- Connexion/déconnexion
- Création/rejoindre une salle
- Démarrage de partie
- Émission d'événements

### `ui-handler.js`
Gère l'interface utilisateur :
- Navigation entre les écrans
- Affichage des messages
- Mise à jour des informations
- Gestion des joueurs

### `bidding-handler.js`
Gère la phase d'enchères :
- Affichage de l'écran d'enchères
- Validation des enchères
- Historique des enchères
- Détermination du preneur

### `dog-handler.js`
Gère le chien et l'écart :
- Réception du chien
- Sélection des cartes à écarter
- Validation des règles d'écart
- Mise à jour de la main

### `king-call-handler.js`
Gère l'appel de Roi (parties à 5 joueurs) :
- Interface d'appel
- Sélection du Roi
- Affichage du Roi appelé
- Détermination du partenaire

### `game-handler.js`
Gère la logique du jeu :
- Affichage du plateau
- Jouer des cartes
- Validation des règles
- Gestion des plis
- Calcul des scores

### `card-utils.js`
Utilitaires pour les cartes :
- Création d'éléments carte
- Tri de la main
- Validation des règles
- Affichage des cartes

## 🔄 Flux de l'application

```
1. tarot-client.js
   ↓
2. Initialisation des modules
   ↓
3. Connexion Socket.io
   ↓
4. Création/Rejoindre salle
   ↓
5. Distribution des cartes
   ↓
6. Phase d'enchères (bidding-handler)
   ↓
7. Gestion du chien (dog-handler)
   ↓
8. Appel de Roi si 5 joueurs (king-call-handler)
   ↓
9. Phase de jeu (game-handler)
   ↓
10. Calcul des scores
```

## 🛠️ Utilisation

### Import dans le HTML
```html
<script type="module" src="/js/tarot-client.js"></script>
```

### Modification du HTML
Le fichier HTML principal doit inclure le script en mode module pour supporter les imports ES6.

## 🔧 Avantages de cette architecture

1. **Séparation des responsabilités** : Chaque module a un rôle bien défini
2. **Maintenabilité** : Plus facile de trouver et corriger des bugs
3. **Réutilisabilité** : Les fonctions peuvent être réutilisées
4. **Testabilité** : Chaque module peut être testé indépendamment
5. **Scalabilité** : Facile d'ajouter de nouvelles fonctionnalités
6. **Lisibilité** : Code plus clair et organisé

## 📝 Notes

- Tous les modules utilisent ES6 modules (import/export)
- L'état global est centralisé dans `state.js`
- Socket.io est accessible via `getSocket()` dans tous les modules
- Les fonctions exposées globalement pour les boutons HTML sont marquées avec `window.functionName`

## 🚀 Prochaines étapes

Pour compléter la migration :
1. Créer les modules manquants (dog-handler, king-call-handler, etc.)
2. Extraire tout le code du HTML vers les fichiers JS
3. Mettre à jour le HTML pour utiliser `<script type="module">`
4. Tester chaque module indépendamment
5. Optimiser et refactoriser si nécessaire
