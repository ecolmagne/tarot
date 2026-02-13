// Utilitaires pour la gestion des cartes

import { state } from './state.js';

// Trier la main du joueur
export function sortHand(hand) {
    hand.sort((a, b) => {
        // L'Excuse va avec les atouts
        const aIsTrumpOrExcuse = a.isTrump || a.isExcuse;
        const bIsTrumpOrExcuse = b.isTrump || b.isExcuse;
        
        // Les atouts (+ Excuse) à la fin
        if (aIsTrumpOrExcuse && !bIsTrumpOrExcuse) return 1;
        if (!aIsTrumpOrExcuse && bIsTrumpOrExcuse) return -1;
        
        // Parmi les atouts/excuse
        if (aIsTrumpOrExcuse && bIsTrumpOrExcuse) {
            // L'Excuse en premier (valeur 0)
            if (a.isExcuse) return -1;
            if (b.isExcuse) return 1;
            // Puis les atouts par ordre croissant
            return parseInt(a.value) - parseInt(b.value);
        }
        
        // Pour les couleurs : ordre Pique, Cœur, Trèfle, Carreau
        const suitOrder = { '♠': 0, '♥': 1, '♣': 2, '♦': 3 };
        if (suitOrder[a.suit] !== suitOrder[b.suit]) {
            return suitOrder[a.suit] - suitOrder[b.suit];
        }
        
        // Même couleur : trier par valeur
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
    
    // Excuse
    if (card.isExcuse) {
        cardDiv.classList.add('excuse');
        cardDiv.innerHTML = `
            <div class="card-corner" style="top: 5px; left: 5px;">★</div>
            <div class="card-center">
                <div class="excuse-star">★</div>
                <div style="font-size: 0.5em; margin-top: 5px;">L'EXCUSE</div>
            </div>
            <div class="card-corner" style="bottom: 5px; right: 5px; transform: rotate(180deg);">★</div>
        `;
        return cardDiv;
    }
    
    // Atout
    if (card.isTrump) {
        cardDiv.classList.add('trump');
        cardDiv.innerHTML = `
            <div class="card-corner" style="top: 5px; left: 5px;">${card.value}</div>
            <div class="card-center">
                <div class="trump-number">${card.value}</div>
                <div style="font-size: 0.4em; margin-top: 5px;">ATOUT</div>
            </div>
            <div class="card-corner" style="bottom: 5px; right: 5px; transform: rotate(180deg);">${card.value}</div>
        `;
        return cardDiv;
    }
    
    // Couleur
    const colorClass = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
    cardDiv.classList.add(colorClass);
    
    // Figure ou nombre
    let centerContent = '';
    if (['V', 'C', 'D', 'R'].includes(card.value)) {
        const figures = { 'V': 'Valet', 'C': 'Cavalier', 'D': 'Dame', 'R': 'Roi' };
        centerContent = `<div class="card-figure">${figures[card.value]}</div>`;
    } else {
        centerContent = `<div style="font-size: 2em;">${card.suit}</div>`;
    }
    
    cardDiv.innerHTML = `
        <div class="card-corner" style="top: 5px; left: 5px;">
            ${card.value}<br>${card.suit}
        </div>
        <div class="card-center">
            ${centerContent}
        </div>
        <div class="card-corner" style="bottom: 5px; right: 5px; transform: rotate(180deg);">
            ${card.value}<br>${card.suit}
        </div>
    `;
    
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
            cardDiv.onclick = () => playCard(index);
        }

        container.appendChild(cardDiv);
    });
}

// Vérifier si une carte peut être jouée
export function canPlayCard(card) {
    if (!state.gameState || !state.gameState.trickCards) return true;
    
    // Règle spéciale : au premier pli UNIQUEMENT, on ne peut pas jouer la couleur du Roi appelé
    // sauf si c'est le Roi lui-même
    if (state.gameState.calledKingSuit && state.currentTrick === 1) {
        if (card.suit === state.gameState.calledKingSuit && 
            !(card.value === 'R' && card.suit === state.gameState.calledKingSuit)) {
            // C'est la couleur appelée mais pas le Roi
            // Vérifier si on a autre chose à jouer
            const hasOtherCards = state.myHand.some(c => 
                c.suit !== state.gameState.calledKingSuit || 
                (c.value === 'R' && c.suit === state.gameState.calledKingSuit) ||
                c.isTrump ||
                c.isExcuse
            );
            if (hasOtherCards) {
                return false; // On ne peut pas jouer cette carte
            }
        }
    }
    // À partir du 2ème pli, on peut jouer normalement la couleur du Roi appelé
    
    // Si c'est le premier joueur du pli
    if (state.gameState.trickCards.length === 0) {
        return true;
    }

    const leadSuit = state.gameState.leadSuit;
    
    // L'excuse peut toujours être jouée
    if (card.isExcuse) {
        return true;
    }

    // Si on demande un atout
    if (leadSuit === 'trump') {
        if (card.isTrump) {
            // Obligation de monter : trouver le plus haut atout déjà joué
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
            
            // Je dois monter si j'ai un atout plus haut
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
    
    // Si on n'a pas la couleur demandée
    const hasSuit = state.myHand.some(c => c.suit === leadSuit);
    if (hasSuit) return false;

    // On doit couper avec un atout
    if (card.isTrump) {
        // Si quelqu'un a déjà coupé, on doit surcouper si possible
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
