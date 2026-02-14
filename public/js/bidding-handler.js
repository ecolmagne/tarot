// Gestion des enchères
import { state } from './state.js';
import { getSocket } from './socket-handler.js';
import { showMessage } from './ui-handler.js';
import { createCardElement } from './card-utils.js';

export function initBidding() {
    const socket = getSocket();

    // Phase d'enchères
    socket.on('biddingPhase', ({ currentPlayerIndex }) => {
        if (!state.gameState) {
            state.gameState = { currentPlayerIndex };
        } else {
            state.gameState.currentPlayerIndex = currentPlayerIndex;
        }

        showBiddingScreen();

        const playerIndex = state.players.findIndex(p => p.id === state.playerId);
        const isMyTurn = currentPlayerIndex === playerIndex;

        updateBiddingInfo(currentPlayerIndex, isMyTurn);
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

        document.getElementById('biddingScreen').style.display = 'none';

        // Sauvegarder le chien
        if (dogCards) {
            state.dogCards = dogCards;
            if (contract === 'petite' || contract === 'garde') {
                displayDogForAll(dogCards);
            }
        }

        showMessage(`${takerName} prend avec ${formatBid(contract)} !`);
    });

}

function showBiddingScreen() {
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('biddingScreen').style.display = 'block';

    renderBiddingHand();
}

function renderBiddingHand() {
    const container = document.getElementById('biddingPlayerHand');
    container.innerHTML = '';
    document.getElementById('biddingHandCount').textContent = state.myHand.length;

    state.myHand.forEach(card => {
        const cardDiv = createCardElement(card, true);
        cardDiv.onclick = null;
        cardDiv.style.cursor = 'default';
        container.appendChild(cardDiv);
    });
}

function updateBiddingInfo(currentPlayerIndex, isMyTurn) {
    const currentPlayer = state.players[currentPlayerIndex];
    const turnInfo = document.getElementById('biddingTurnInfo');

    if (isMyTurn) {
        turnInfo.textContent = 'A vous d\'enchérir !';
        turnInfo.style.color = '#27ae60';
        document.getElementById('biddingButtons').style.display = 'block';
    } else {
        turnInfo.textContent = `${currentPlayer.name} est en train d'enchérir...`;
        turnInfo.style.color = '#666';
        document.getElementById('biddingButtons').style.display = 'none';
    }

    // Afficher les enchères précédentes
    const bidsDiv = document.getElementById('currentBids');
    bidsDiv.innerHTML = '';
    if (state.currentBids.length > 0) {
        bidsDiv.innerHTML = '<strong>Enchères :</strong><br>' +
            state.currentBids.map(b => `${state.players[b.playerIndex].name}: ${formatBid(b.bid)}`).join(' \u2022 ');
    }

    updateBidButtons();
}

function formatBid(bid) {
    const labels = {
        'pass': 'Passe',
        'petite': 'Petite',
        'garde': 'Garde',
        'garde-sans': 'Garde sans',
        'garde-contre': 'Garde contre'
    };
    return labels[bid] || bid;
}

function updateBidButtons() {
    const bidValues = { 'pass': 0, 'petite': 1, 'garde': 2, 'garde-sans': 3, 'garde-contre': 4 };
    let highestBidValue = 0;

    state.currentBids.forEach(b => {
        if (b.bid !== 'pass' && bidValues[b.bid] > highestBidValue) {
            highestBidValue = bidValues[b.bid];
        }
    });

    ['petite', 'garde', 'garde-sans', 'garde-contre'].forEach(bid => {
        const btn = document.getElementById('bid' + bid.charAt(0).toUpperCase() + bid.slice(1).replace('-', ''));
        if (btn) {
            if (bidValues[bid] <= highestBidValue) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        }
    });
}

function makeBid(bid) {
    const socket = getSocket();
    socket.emit('makeBid', {
        roomCode: state.roomCode,
        bid: bid
    });

    document.getElementById('biddingButtons').style.display = 'none';
}

function displayDogForAll(dogCards) {
    const dogDisplay = document.getElementById('dogDisplay');
    const dogCardsDisplay = document.getElementById('dogCardsDisplay');

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

// Exposer globalement
window.makeBid = makeBid;
