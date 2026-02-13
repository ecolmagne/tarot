// Gestion des enchères
import { state } from './state.js';
import { getSocket } from './socket-handler.js';
import { showMessage } from './ui-handler.js';
import { renderPlayerHand, sortHand } from './card-utils.js';

export function initBidding() {
    const socket = getSocket();
    
    // Phase d'enchères
    socket.on('biddingPhase', ({ currentPlayerIndex }) => {
        if (!state.gameState) {
            state.gameState = { currentPlayerIndex };
        } else {
            state.gameState.currentPlayerIndex = currentPlayerIndex;
        }
        
        const myPlayerIndex = state.players.findIndex(p => p.id === state.playerId);
        const isMyTurn = currentPlayerIndex === myPlayerIndex;
        
        setTimeout(() => {
            showBiddingScreen();
            updateBiddingInfo(currentPlayerIndex, isMyTurn);
        }, 2000);
    });
    
    // Une enchère a été faite
    socket.on('bidMade', ({ playerIndex, bid, nextPlayerIndex }) => {
        state.currentBids.push({ playerIndex, bid });
        
        const player = state.players[playerIndex];
        showMessage(`${player.name} : ${formatBid(bid)}`);
        
        const myPlayerIndex = state.players.findIndex(p => p.id === state.playerId);
        const isMyTurn = nextPlayerIndex === myPlayerIndex;
        
        updateBiddingInfo(nextPlayerIndex, isMyTurn);
    });
    
    // Enchères terminées
    socket.on('biddingComplete', ({ takerIndex, takerName, contract, dogCards }) => {
        state.gameState.takerIndex = takerIndex;
        state.gameState.taker = takerName;
        state.gameState.contract = contract;
        state.gameState.phase = 'playing';
        state.gameState.trickCards = [];
        
        // Cacher l'écran d'enchères
        document.getElementById('biddingScreen').style.display = 'none';
        
        // Afficher le chien à tous les joueurs
        if (dogCards) {
            displayDogForAll(dogCards);
        }
        
        showMessage(`🎯 ${takerName} prend avec ${formatBid(contract)} !`);
    });
    
    // Tous les joueurs ont passé
    socket.on('allPassed', () => {
        showMessage('❌ Tous les joueurs ont passé. Nouvelle donne...');
        setTimeout(() => {
            location.reload();
        }, 3000);
    });
}

export function makeBid(bid) {
    const socket = getSocket();
    socket.emit('makeBid', {
        roomCode: state.roomCode,
        bid: bid
    });
}

function showBiddingScreen() {
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('biddingScreen').style.display = 'block';
    
    // Afficher la main pendant les enchères
    renderPlayerHand();
}

function updateBiddingInfo(currentPlayerIndex, isMyTurn) {
    const currentPlayerName = state.players[currentPlayerIndex]?.name || 'Joueur';
    const turnInfo = document.getElementById('biddingTurnInfo');
    
    if (turnInfo) {
        if (isMyTurn) {
            turnInfo.innerHTML = '<strong style="color: #27ae60;">C\'est votre tour d\'enchérir !</strong>';
        } else {
            turnInfo.innerHTML = `En attente de <strong>${currentPlayerName}</strong>...`;
        }
    }
    
    // Activer/désactiver les boutons
    const buttons = document.querySelectorAll('.bid-btn');
    buttons.forEach(btn => {
        btn.disabled = !isMyTurn;
        btn.style.opacity = isMyTurn ? '1' : '0.5';
        btn.style.cursor = isMyTurn ? 'pointer' : 'not-allowed';
    });
    
    // Désactiver les enchères inférieures ou égales à la plus haute
    if (isMyTurn) {
        updateBidButtons();
    }
    
    // Afficher les enchères précédentes
    displayCurrentBids();
}

function updateBidButtons() {
    const bidValues = { 'petite': 1, 'garde': 2, 'garde-sans': 3, 'garde-contre': 4 };
    let highestBidValue = 0;
    
    state.currentBids.forEach(b => {
        if (b.bid !== 'pass' && bidValues[b.bid] > highestBidValue) {
            highestBidValue = bidValues[b.bid];
        }
    });
    
    // Désactiver les enchères <= à la plus haute
    document.querySelectorAll('.bid-btn:not([data-bid="pass"])').forEach(btn => {
        const bidValue = bidValues[btn.dataset.bid];
        if (bidValue <= highestBidValue) {
            btn.disabled = true;
            btn.style.opacity = '0.3';
        }
    });
}

function displayCurrentBids() {
    const container = document.getElementById('bidsHistory');
    if (!container) return;
    
    container.innerHTML = '<h4>Enchères :</h4>';
    
    state.currentBids.forEach(({ playerIndex, bid }) => {
        const player = state.players[playerIndex];
        const bidDiv = document.createElement('div');
        bidDiv.style.padding = '5px';
        bidDiv.innerHTML = `${player.name} : <strong>${formatBid(bid)}</strong>`;
        container.appendChild(bidDiv);
    });
}

function formatBid(bid) {
    const bids = {
        'pass': 'Passe',
        'petite': 'Petite',
        'garde': 'Garde',
        'garde-sans': 'Garde sans le chien',
        'garde-contre': 'Garde contre le chien'
    };
    return bids[bid] || bid;
}

function displayDogForAll(dogCards) {
    const dogDisplay = document.getElementById('dogDisplay');
    const dogCardsDisplay = document.getElementById('dogCardsDisplay');
    
    if (!dogDisplay || !dogCardsDisplay) return;
    
    dogCardsDisplay.innerHTML = '';
    
    dogCards.forEach(card => {
        const cardDiv = createCardElement(card, false);
        cardDiv.style.width = '35px';
        cardDiv.style.height = '52px';
        cardDiv.style.fontSize = '0.5em';
        cardDiv.onclick = null;
        cardDiv.style.cursor = 'default';
        dogCardsDisplay.appendChild(cardDiv);
    });
    
    dogDisplay.classList.remove('hidden');
}

// Utilitaire pour créer un élément carte (à déplacer dans card-utils.js)
function createCardElement(card, fullSize = true) {
    // Cette fonction devrait être dans card-utils.js
    // Pour l'instant, version simplifiée
    const div = document.createElement('div');
    div.className = 'card';
    div.textContent = `${card.value}${card.suit}`;
    return div;
}

// Exposer les fonctions globalement pour les boutons HTML
window.makeBid = makeBid;
