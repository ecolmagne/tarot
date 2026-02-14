// Règles du jeu de Tarot

// Vérifier si une carte peut être jouée
function canPlayCard(card, hand, gameState) {
    // Règle spéciale : au premier pli, la couleur du Roi appelé est protégée
    if (gameState.calledKingSuit && gameState.currentTrick === 1 && gameState.playerCount === 5) {
        const isFirstPlayer = gameState.trickCards.length === 0;
        const isCalledKing = card.value === 'R' && card.suit === gameState.calledKingSuit;
        const leadIsCalledSuit = gameState.leadSuit === gameState.calledKingSuit;

        if (card.suit === gameState.calledKingSuit && !card.isTrump && !card.isExcuse) {
            if (isCalledKing && !isFirstPlayer) {
                // Le roi appelé ne peut être joué que par le premier joueur du pli
                const hasOtherCards = hand.some(c =>
                    !(c.value === 'R' && c.suit === gameState.calledKingSuit)
                );
                if (hasOtherCards) return false;
            } else if (!isCalledKing && !leadIsCalledSuit) {
                // Les autres cartes de la couleur sont interdites,
                // sauf si le roi appelé a été joué en ouverture (on suit la couleur)
                const hasOtherCards = hand.some(c =>
                    c.suit !== gameState.calledKingSuit ||
                    c.isTrump ||
                    c.isExcuse
                );
                if (hasOtherCards) return false;
            }
        }
    }
    // À partir du 2ème pli, on peut jouer normalement la couleur du Roi appelé
    
    // Premier joueur du pli
    if (gameState.trickCards.length === 0 || gameState.playerCount !== 5) {
        return true;
    }

    const leadSuit = gameState.leadSuit;

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
            // Obligation de monter à l'atout
            let highestTrump = 0;
            gameState.trickCards.forEach(tc => {
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
                const hasHigherTrump = hand.some(c => 
                    c.isTrump && !c.isExcuse && parseInt(c.value) > highestTrump
                );
                return !hasHigherTrump;
            }
        }
        
        const hasTrump = hand.some(c => c.isTrump);
        return !hasTrump;
    }

    // Si on demande une couleur
    if (card.suit === leadSuit) return true;
    
    const hasSuit = hand.some(c => c.suit === leadSuit);
    if (hasSuit) return false;

    // On doit couper avec un atout
    if (card.isTrump) {
        // Si quelqu'un a déjà coupé, on doit surcouper si possible
        let highestTrump = 0;
        let someoneAlreadyCut = false;
        
        gameState.trickCards.forEach(tc => {
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
                const hasHigherTrump = hand.some(c => 
                    c.isTrump && !c.isExcuse && parseInt(c.value) > highestTrump
                );
                return !hasHigherTrump;
            }
        }
        
        return true; // Première coupe
    }
    
    // On peut défausser si on n'a pas d'atout
    const hasTrump = hand.some(c => c.isTrump);
    return !hasTrump;
}

// Déterminer le gagnant d'un pli
function determineTrickWinner(trickCards, leadSuit) {
    let winnerIndex = 0;
    let highestCard = trickCards[0];

    // L'excuse ne gagne jamais
    if (highestCard.card.isExcuse) {
        for (let i = 1; i < trickCards.length; i++) {
            if (!trickCards[i].card.isExcuse) {
                highestCard = trickCards[i];
                winnerIndex = i;
                break;
            }
        }
    }

    for (let i = 1; i < trickCards.length; i++) {
        const current = trickCards[i];
        
        // L'excuse ne gagne jamais
        if (current.card.isExcuse) continue;
        
        // Atout bat tout
        if (current.card.isTrump && !highestCard.card.isTrump) {
            highestCard = current;
            winnerIndex = i;
            continue;
        }
        
        // Entre atouts, le plus haut gagne
        if (current.card.isTrump && highestCard.card.isTrump) {
            if (parseInt(current.card.value) > parseInt(highestCard.card.value)) {
                highestCard = current;
                winnerIndex = i;
            }
            continue;
        }
        
        // Si pas d'atout, la couleur demandée gagne
        if (!current.card.isTrump && !highestCard.card.isTrump) {
            if (current.card.suit === leadSuit && highestCard.card.suit !== leadSuit) {
                highestCard = current;
                winnerIndex = i;
            } else if (current.card.suit === leadSuit && highestCard.card.suit === leadSuit) {
                const currentVal = isNaN(current.card.value) ? 
                    ({ 'V': 11, 'C': 12, 'D': 13, 'R': 14 }[current.card.value] || 0) : 
                    parseInt(current.card.value);
                const highestVal = isNaN(highestCard.card.value) ? 
                    ({ 'V': 11, 'C': 12, 'D': 13, 'R': 14 }[highestCard.card.value] || 0) : 
                    parseInt(highestCard.card.value);
                
                if (currentVal > highestVal) {
                    highestCard = current;
                    winnerIndex = i;
                }
            }
        }
    }

    return trickCards[winnerIndex].playerIndex;
}

// Calculer les points requis selon le nombre de bouts
function getRequiredPoints(boutsCount, playerCount) {
    const basePoints = {
        0: 56,
        1: 51,
        2: 41,
        3: 36
    };
    
    return basePoints[boutsCount];
}

// Calculer le multiplicateur du contrat
function getContractMultiplier(contract) {
    const multipliers = {
        'petite': 1,
        'garde': 2,
        'garde-sans': 4,
        'garde-contre': 6
    };
    return multipliers[contract] || 1;
}

// Compter les bouts dans les plis
function countBouts(tricks) {
    let bouts = 0;
    tricks.forEach(trick => {
        trick.forEach(tc => {
            if (tc.card.isExcuse) bouts++;
            if (tc.card.isTrump && (tc.card.value === '1' || tc.card.value === '21')) bouts++;
        });
    });
    return bouts;
}

module.exports = {
    canPlayCard,
    determineTrickWinner,
    getRequiredPoints,
    getContractMultiplier,
    countBouts
};
