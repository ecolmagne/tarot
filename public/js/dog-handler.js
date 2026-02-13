// Gestion du chien et de l'écart
import { state } from './state.js';
import { getSocket } from './socket-handler.js';
import { showMessage } from './ui-handler.js';
import { sortHand, createCardElement } from './card-utils.js';

export function initDog() {
    const socket = getSocket();
    
    // Recevoir le chien
    socket.on('receiveDog', ({ dogCards }) => {
        showMessage('🎴 Vous avez reçu le chien !');
        setTimeout(() => {
            showDogScreen(dogCards);
        }, 1500);
    });
    
    // Message pour les autres joueurs pendant l'écart
    socket.on('waitingForDog', () => {
        showMessage('⏳ Le preneur fait son écart...');
    });
    
    // L'écart a été validé
    socket.on('dogSet', ({ updatedHand }) => {
        showMessage('✅ Écart validé !');
        
        // Mettre à jour la main avec celle du serveur
        if (updatedHand) {
            state.myHand = updatedHand;
            sortHand(state.myHand);
            
            // Forcer le rafraîchissement visuel si on est déjà dans l'écran de jeu
            if (document.getElementById('gameScreen').style.display === 'block') {
                renderPlayerHand();
            }
        }
        
        document.getElementById('dogScreen').style.display = 'none';
    });
}

function showDogScreen(dogCards) {
    document.getElementById('biddingScreen').style.display = 'none';
    
    // Garder le chien visible pour tous - ne pas le masquer
    // Le chien est déjà affiché dans dogDisplay depuis biddingComplete
    
    document.getElementById('dogScreen').style.display = 'block';

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
        
        // Vérifier si la carte est sélectionnée
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

export function toggleDogCard(card, index) {
    const expectedCount = state.dogCards.length; // 3 ou 6
    
    const isSelected = state.selectedDogCards.some(c => 
        c.suit === card.suit && c.value === card.value
    );

    if (isSelected) {
        // Désélectionner
        state.selectedDogCards = state.selectedDogCards.filter(c => 
            !(c.suit === card.suit && c.value === card.value)
        );
    } else {
        // Vérifier si on peut sélectionner cette carte
        if (state.selectedDogCards.length >= expectedCount) {
            showMessage(`❌ Vous ne pouvez sélectionner que ${expectedCount} cartes`);
            return;
        }

        // Vérifier les règles de l'écart
        if (card.value === 'R') {
            showMessage('❌ Vous ne pouvez pas écarter un Roi');
            return;
        }

        if (card.isTrump) {
            // On peut écarter un atout seulement si on a l'Excuse et qu'on l'écarte aussi
            const hasExcuse = state.myHand.some(c => c.isExcuse);
            const excuseSelected = state.selectedDogCards.some(c => c.isExcuse);
            
            if (!hasExcuse || !excuseSelected) {
                showMessage('❌ Vous ne pouvez écarter un atout que si vous écartez aussi l\'Excuse');
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
    
    // Afficher les cartes sélectionnées
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
    
    // Activer/désactiver le bouton de validation
    const validateBtn = document.getElementById('validateDogBtn');
    if (validateBtn) {
        const canValidate = state.selectedDogCards.length === expectedCount;
        validateBtn.disabled = !canValidate;
        validateBtn.style.opacity = canValidate ? '1' : '0.5';
    }
}

export function validateDog() {
    const expectedCount = state.dogCards.length;
    
    if (state.selectedDogCards.length !== expectedCount) {
        showMessage(`❌ Vous devez sélectionner exactement ${expectedCount} cartes`);
        return;
    }

    const socket = getSocket();
    socket.emit('setDog', {
        roomCode: state.roomCode,
        dogCards: state.selectedDogCards
    });

    // Le serveur va retirer les cartes - on ne modifie pas state.myHand ici
    state.selectedDogCards = [];
}

// Import placeholder (sera fourni par card-utils.js)
function renderPlayerHand() {
    // Cette fonction est dans card-utils.js
    console.log('renderPlayerHand appelé depuis dog-handler');
}

// Exposer les fonctions globalement
window.toggleDogCard = toggleDogCard;
window.validateDog = validateDog;
