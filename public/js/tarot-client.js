// Application principale Tarot
import { initSocket } from './socket-handler.js';
import { initUI } from './ui-handler.js';
import { initBidding } from './bidding-handler.js';
import { initDog } from './dog-handler.js';
import { initKingCall } from './king-call-handler.js';
import { initGame } from './game-handler.js';
import { state } from './state.js';

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎴 Application Tarot chargée');
    
    // Initialiser tous les modules dans le bon ordre
    initSocket();
    console.log('✅ Socket.io initialisé');
    
    initUI();
    console.log('✅ Interface utilisateur initialisée');
    
    initBidding();
    console.log('✅ Module enchères initialisé');
    
    initDog();
    console.log('✅ Module chien initialisé');
    
    initKingCall();
    console.log('✅ Module appel de Roi initialisé');
    
    initGame();
    console.log('✅ Module jeu initialisé');
    
    console.log('🎮 Tous les modules initialisés avec succès !');
});

// Exporter pour debug
window.tarotState = state;
console.log('💡 État de l\'application accessible via window.tarotState');
