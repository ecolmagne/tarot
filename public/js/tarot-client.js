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
    // Initialiser tous les modules dans le bon ordre
    initSocket();
    initUI();
    initBidding();
    initDog();
    initKingCall();
    initGame();

    // Gestion du lien partage (?room=CODE)
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');

    if (roomCode) {
        document.getElementById('roomCode').value = roomCode;
        document.querySelector('.player-count-selector').style.display = 'none';
        document.getElementById('roomButtons').style.display = 'none';
        window.showJoinRoom();
    }
});

// Exporter pour debug
window.tarotState = state;
