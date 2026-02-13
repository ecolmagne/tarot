// Gestion de l'appel de Roi (5 joueurs)
import { state } from './state.js';
import { getSocket } from './socket-handler.js';
import { showMessage } from './ui-handler.js';
import { createCardElement } from './card-utils.js';

export function initKingCall() {
    const socket = getSocket();
    
    // Demande d'appel de Roi
    socket.on('requestKingCall', ({ isTaker }) => {
        if (isTaker) {
            showMessage('👑 Appelez un Roi pour jouer avec vous');
            setTimeout(() => {
                showKingCallScreen();
                const kingCallButtons = document.getElementById('kingCallButtons');
                if (kingCallButtons) {
                    kingCallButtons.style.display = 'block';
                }
            }, 1500);
        } else {
            showMessage('👑 Le preneur est en train d\'appeler un Roi...');
            setTimeout(() => {
                showKingCallScreen();
                const kingCallButtons = document.getElementById('kingCallButtons');
                const kingCallMessage = document.getElementById('kingCallMessage');
                
                if (kingCallButtons) {
                    kingCallButtons.style.display = 'none';
                }
                if (kingCallMessage) {
                    kingCallMessage.innerHTML = '<p>⏳ Le preneur est en train d\'appeler un Roi...</p>';
                }
            }, 1500);
        }
    });
    
    // Un Roi a été appelé
    socket.on('kingCalled', ({ suit, calledKing }) => {
        showMessage(`👑 Le ${calledKing} a été appelé !`);
        
        if (state.gameState) {
            state.gameState.calledKing = calledKing;
            state.gameState.calledKingSuit = suit;
        }
        
        // Afficher le Roi appelé dans le header
        const calledKingInfo = document.getElementById('calledKingInfo');
        const calledKingValue = document.getElementById('calledKingValue');
        
        if (calledKingInfo) {
            calledKingInfo.style.display = 'block';
        }
        if (calledKingValue) {
            calledKingValue.textContent = calledKing;
        }
    });
}

function showKingCallScreen() {
    document.getElementById('biddingScreen').style.display = 'none';
    document.getElementById('dogScreen').style.display = 'none';
    document.getElementById('kingCallScreen').style.display = 'block';
    
    // Afficher la main du preneur
    renderKingCallHand();
}

function renderKingCallHand() {
    const container = document.getElementById('kingCallPlayerHand');
    if (!container) return;
    
    container.innerHTML = '';
    
    const kingCallHandCount = document.getElementById('kingCallHandCount');
    if (kingCallHandCount) {
        kingCallHandCount.textContent = state.myHand.length;
    }

    state.myHand.forEach((card, index) => {
        const cardDiv = createCardElement(card, true);
        cardDiv.onclick = null; // Pas cliquable pendant l'appel
        cardDiv.style.cursor = 'default';
        container.appendChild(cardDiv);
    });
}

export function callKing(suit) {
    const socket = getSocket();
    
    socket.emit('callKing', {
        roomCode: state.roomCode,
        suit: suit
    });

    const kingCallButtons = document.getElementById('kingCallButtons');
    const kingCallMessage = document.getElementById('kingCallMessage');
    
    if (kingCallButtons) {
        kingCallButtons.style.display = 'none';
    }
    if (kingCallMessage) {
        kingCallMessage.innerHTML = '<p style="color: #27ae60; font-weight: bold;">⏳ En attente du début de la partie...</p>';
    }
}

// Exposer les fonctions globalement
window.callKing = callKing;
