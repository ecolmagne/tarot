// Utilitaires pour la gestion des cartes
import { state } from './state.js';

// Trier la main du joueur
export function sortHand(hand) {
    hand.sort((a, b) => {
        const aIsTrumpOrExcuse = a.isTrump || a.isExcuse;
        const bIsTrumpOrExcuse = b.isTrump || b.isExcuse;

        if (aIsTrumpOrExcuse && !bIsTrumpOrExcuse) return 1;
        if (!aIsTrumpOrExcuse && bIsTrumpOrExcuse) return -1;

        if (aIsTrumpOrExcuse && bIsTrumpOrExcuse) {
            if (a.isExcuse) return -1;
            if (b.isExcuse) return 1;
            return parseInt(a.value) - parseInt(b.value);
        }

        const suitOrder = { '♠': 0, '♥': 1, '♣': 2, '♦': 3 };
        if (suitOrder[a.suit] !== suitOrder[b.suit]) {
            return suitOrder[a.suit] - suitOrder[b.suit];
        }

        const aVal = isNaN(a.value) ? ({ 'V': 11, 'C': 12, 'D': 13, 'R': 14 }[a.value] || 0) : parseInt(a.value);
        const bVal = isNaN(b.value) ? ({ 'V': 11, 'C': 12, 'D': 13, 'R': 14 }[b.value] || 0) : parseInt(b.value);

        return aVal - bVal;
    });
}

// Créer un élément visuel de carte
export function createCardElement(card, fullSize = true) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    if (!fullSize) {
        cardDiv.style.fontSize = '0.8em';
    }

    if (card.isTrump) {
        cardDiv.classList.add('trump');
        cardDiv.innerHTML = `
            <div class="card-center">
                <div class="trump-number">${card.value}</div>
                <div class="trump-label">Atout</div>
            </div>
        `;
    } else if (card.isExcuse) {
        cardDiv.innerHTML = `
            <div class="card-center">
                <div class="excuse-star">★</div>
                <div class="excuse-label">L'Excuse</div>
            </div>
        `;
    } else {
        const suitClass = card.suit === '♥' || card.suit === '♦' ? 'hearts' : 'clubs';
        cardDiv.classList.add(suitClass);

        const figureLabels = {
            'V': 'Valet',
            'C': 'Cavalier',
            'D': 'Dame',
            'R': 'Roi'
        };

        const isFigure = ['V', 'C', 'D', 'R'].includes(card.value);

        if (isFigure) {
            cardDiv.innerHTML = `
                <div class="card-corner top-left">
                    <div>${card.value}</div>
                    <div>${card.suit}</div>
                </div>
                <div class="card-center">
                    <div class="card-figure">${figureLabels[card.value]}</div>
                    <div class="card-suit" style="font-size: 2em; margin-top: 5px;">${card.suit}</div>
                </div>
                <div class="card-corner bottom-right">
                    <div>${card.value}</div>
                    <div>${card.suit}</div>
                </div>
            `;
        } else {
            cardDiv.innerHTML = `
                <div class="card-corner top-left">
                    <div>${card.value}</div>
                    <div>${card.suit}</div>
                </div>
                <div class="card-center">
                    <div class="card-suit" style="font-size: 2.5em;">${card.suit}</div>
                </div>
                <div class="card-corner bottom-right">
                    <div>${card.value}</div>
                    <div>${card.suit}</div>
                </div>
            `;
        }
    }

    return cardDiv;
}

// Rendre la main du joueur
export function renderPlayerHand() {
    const container = document.getElementById('playerHand');
    if (!container) return;

    container.innerHTML = '';
    const handCount = document.getElementById('handCount');
    if (handCount) {
        handCount.textContent = state.myHand.length;
    }

    state.myHand.forEach((card, index) => {
        const cardDiv = createCardElement(card, true);

        if (!canPlayCard(card)) {
            cardDiv.classList.add('disabled');
        } else {
            cardDiv.onclick = () => window.playCard(index);
        }

        container.appendChild(cardDiv);
    });
}

// Vérifier si une carte peut être jouée
export function canPlayCard(card) {
    if (!state.gameState || !state.gameState.trickCards) return true;

    // Règle spéciale : au premier pli, la couleur du Roi appelé est protégée
    if (state.gameState.calledKingSuit && state.currentTrick === 1 && state.playerCount === 5) {
        const isFirstPlayer = state.gameState.trickCards.length === 0;
        const isCalledKing = card.value === 'R' && card.suit === state.gameState.calledKingSuit;

        // Déterminer la couleur d'entame depuis les cartes jouées
        let leadSuitForKing = null;
        if (state.gameState.trickCards.length > 0) {
            const firstCard = state.gameState.trickCards[0].card;
            if (firstCard.isTrump) leadSuitForKing = 'trump';
            else if (!firstCard.isExcuse) leadSuitForKing = firstCard.suit;
        }
        const leadIsCalledSuit = leadSuitForKing === state.gameState.calledKingSuit;

        if (card.suit === state.gameState.calledKingSuit && !card.isTrump && !card.isExcuse) {
            if (isCalledKing && !isFirstPlayer) {
                // Le roi appelé ne peut être joué que par le premier joueur du pli
                const hasOtherCards = state.myHand.some(c =>
                    !(c.value === 'R' && c.suit === state.gameState.calledKingSuit)
                );
                if (hasOtherCards) return false;
            } else if (!isCalledKing && !leadIsCalledSuit) {
                // Les autres cartes de la couleur sont interdites,
                // sauf si le roi appelé a été joué en ouverture (on suit la couleur)
                const hasOtherCards = state.myHand.some(c =>
                    c.suit !== state.gameState.calledKingSuit ||
                    c.isTrump ||
                    c.isExcuse
                );
                if (hasOtherCards) return false;
            }
        }
    }

    // Si c'est le premier joueur du pli
    if (state.gameState.trickCards.length === 0 || state.playerCount !== 5) {
        return true;
    }

    // Déterminer la couleur d'entame depuis les cartes jouées
    let leadSuit = null;
    if (state.gameState.trickCards.length > 0) {
        const firstCard = state.gameState.trickCards[0].card;
        if (firstCard.isTrump) leadSuit = 'trump';
        else if (!firstCard.isExcuse) leadSuit = firstCard.suit;

        // Si l'Excuse a été jouée en ouverture, le 2ème joueur définit la couleur
        if (leadSuit === null && state.gameState.trickCards.length >= 2) {
            const secondCard = state.gameState.trickCards[1].card;
            if (secondCard.isTrump) leadSuit = 'trump';
            else if (!secondCard.isExcuse) leadSuit = secondCard.suit;
        }
    }

    // L'excuse peut toujours être jouée
    if (card.isExcuse) {
        return true;
    }

    // Si l'Excuse a été jouée en ouverture, le joueur suivant choisit librement
    if (leadSuit === null) {
        return true;
    }

    // Si on demande un atout
    if (leadSuit === 'trump') {
        if (card.isTrump) {
            let highestTrump = 0;
            state.gameState.trickCards.forEach(tc => {
                if (tc.card.isTrump && !tc.card.isExcuse) {
                    const trumpValue = parseInt(tc.card.value);
                    if (trumpValue > highestTrump) {
                        highestTrump = trumpValue;
                    }
                }
            });

            const myTrumpValue = parseInt(card.value);

            if (myTrumpValue > highestTrump) {
                return true;
            } else {
                const hasHigherTrump = state.myHand.some(c =>
                    c.isTrump && !c.isExcuse && parseInt(c.value) > highestTrump
                );
                return !hasHigherTrump;
            }
        }

        const hasTrump = state.myHand.some(c => c.isTrump);
        return !hasTrump;
    }

    // Si on demande une couleur
    if (card.suit === leadSuit) return true;

    const hasSuit = state.myHand.some(c => c.suit === leadSuit);
    if (hasSuit) return false;

    // On doit couper avec un atout
    if (card.isTrump) {
        let highestTrump = 0;
        let someoneAlreadyCut = false;

        state.gameState.trickCards.forEach(tc => {
            if (tc.card.isTrump && !tc.card.isExcuse) {
                someoneAlreadyCut = true;
                const trumpValue = parseInt(tc.card.value);
                if (trumpValue > highestTrump) {
                    highestTrump = trumpValue;
                }
            }
        });

        if (someoneAlreadyCut) {
            const myTrumpValue = parseInt(card.value);

            if (myTrumpValue > highestTrump) {
                return true;
            } else {
                const hasHigherTrump = state.myHand.some(c =>
                    c.isTrump && !c.isExcuse && parseInt(c.value) > highestTrump
                );
                return !hasHigherTrump;
            }
        }

        return true;
    }

    // On peut défausser si on n'a pas d'atout
    const hasTrump = state.myHand.some(c => c.isTrump);
    return !hasTrump;
}
