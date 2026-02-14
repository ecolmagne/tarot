// Gestion du chien et de l'écart
import { state } from './state.js';
import { getSocket } from './socket-handler.js';
import { showMessage, showWaitingDogScreen } from './ui-handler.js';
import { sortHand, createCardElement, renderPlayerHand } from './card-utils.js';

export function initDog() {
    const socket = getSocket();

    // Recevoir le chien
    socket.on('receiveDog', ({ dogCards }) => {
        showMessage('Vous avez reçu le chien !');
        setTimeout(() => {
            showDogScreen(dogCards);
        }, 1500);
    });

    // Message pour les autres joueurs pendant l'écart
    socket.on('waitingForDog', () => {
        showMessage('Le preneur fait son écart...');
        showWaitingDogScreen();
    });

    // L'écart a été validé
    socket.on('dogSet', ({ updatedHand }) => {
        showMessage('Écart validé !');

        if (updatedHand) {
            state.myHand = updatedHand;
            sortHand(state.myHand);

            if (document.getElementById('gameScreen').style.display === 'block') {
                renderPlayerHand();
            }
        }

        document.getElementById('dogScreen').style.display = 'none';
    });
}

function showDogScreen(dogCards) {
    document.getElementById('biddingScreen').style.display = 'none';
    document.getElementById('kingCallScreen').style.display = 'none';
    document.getElementById('dogScreen').style.display = 'block';

    // Afficher le roi appelé si à 5 joueurs
    const calledKingDog = document.getElementById('calledKingDog');
    if (calledKingDog && state.gameState && state.gameState.calledKing) {
        calledKingDog.textContent = state.gameState.calledKing;
        document.getElementById('calledKingDogInfo').style.display = 'block';
    }

    state.dogCards = dogCards;
    state.selectedDogCards = [];

    // Ajouter les cartes du chien à la main
    state.myHand = state.myHand.concat(dogCards);
    sortHand(state.myHand);

    // Afficher le nombre de cartes à écarter
    const dogSize = dogCards.length;
    const dogCardsNeededEl = document.getElementById('dogCardsNeeded');
    const selectedNeededEl = document.getElementById('selectedNeeded');

    if (dogCardsNeededEl) dogCardsNeededEl.textContent = dogSize;
    if (selectedNeededEl) selectedNeededEl.textContent = dogSize;

    renderDogCards();
    renderDogHand();
}

function renderDogCards() {
    const container = document.getElementById('dogCards');
    if (!container) return;

    container.innerHTML = '';

    state.dogCards.forEach(card => {
        const cardDiv = createCardElement(card, false);
        cardDiv.style.width = '60px';
        cardDiv.style.height = '90px';
        container.appendChild(cardDiv);
    });
}

function renderDogHand() {
    const container = document.getElementById('dogPlayerHand');
    if (!container) return;

    container.innerHTML = '';

    const dogHandCountEl = document.getElementById('dogHandCount');
    if (dogHandCountEl) {
        dogHandCountEl.textContent = state.myHand.length;
    }

    state.myHand.forEach((card, index) => {
        const cardDiv = createCardElement(card, true);

        const isSelected = state.selectedDogCards.some(c =>
            c.suit === card.suit && c.value === card.value
        );

        if (isSelected) {
            cardDiv.classList.add('selected');
        }

        cardDiv.onclick = () => toggleDogCard(card, index);
        container.appendChild(cardDiv);
    });

    updateDogSelection();
}

function toggleDogCard(card) {
    const expectedCount = state.dogCards.length;

    const isSelected = state.selectedDogCards.some(c =>
        c.suit === card.suit && c.value === card.value
    );

    if (isSelected) {
        state.selectedDogCards = state.selectedDogCards.filter(c =>
            !(c.suit === card.suit && c.value === card.value)
        );
    } else {
        if (state.selectedDogCards.length >= expectedCount) {
            showMessage(`Vous ne pouvez sélectionner que ${expectedCount} cartes`);
            return;
        }

        if (card.value === 'R') {
            showMessage('Vous ne pouvez pas écarter un Roi');
            return;
        }

        if (card.isTrump) {
            const hasExcuse = state.myHand.some(c => c.isExcuse);
            const excuseSelected = state.selectedDogCards.some(c => c.isExcuse);

            if (!hasExcuse || !excuseSelected) {
                showMessage('Vous ne pouvez écarter un atout que si vous écartez aussi l\'Excuse');
                return;
            }
        }

        state.selectedDogCards.push(card);
    }

    renderDogHand();
}

function updateDogSelection() {
    const expectedCount = state.dogCards.length;

    const selectedCountEl = document.getElementById('selectedCount');
    if (selectedCountEl) {
        selectedCountEl.textContent = state.selectedDogCards.length;
    }

    const selectedCardsContainer = document.getElementById('selectedCards');
    if (selectedCardsContainer) {
        selectedCardsContainer.innerHTML = '';

        state.selectedDogCards.forEach(card => {
            const cardDiv = createCardElement(card, false);
            cardDiv.style.width = '50px';
            cardDiv.style.height = '75px';
            selectedCardsContainer.appendChild(cardDiv);
        });
    }

    const validateBtn = document.getElementById('validateDogBtn');
    if (validateBtn) {
        const canValidate = state.selectedDogCards.length === expectedCount;
        validateBtn.disabled = !canValidate;
        validateBtn.style.opacity = canValidate ? '1' : '0.5';
    }
}

function validateDog() {
    const expectedCount = state.dogCards.length;

    if (state.selectedDogCards.length !== expectedCount) {
        showMessage(`Vous devez sélectionner exactement ${expectedCount} cartes`);
        return;
    }

    const socket = getSocket();
    socket.emit('setDog', {
        roomCode: state.roomCode,
        dogCards: state.selectedDogCards
    });

    state.selectedDogCards = [];
}

// Exposer les fonctions globalement
window.toggleDogCard = toggleDogCard;
window.validateDog = validateDog;
