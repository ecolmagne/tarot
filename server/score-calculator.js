// Calculateur de scores
const { getRequiredPoints, getContractMultiplier, countBouts } = require('./game-rules');
const { calculateTrickPoints } = require('./deck-utils');

// Calculer les scores de fin de partie
function calculateFinalScores(room) {
    const { gameState, players, maxPlayers } = room;
    const { takerIndex, partnerIndex, contract, petitAuBout, petitAuBoutWinner } = gameState;
    
    // Compter les points du preneur
    // L'Excuse appartient à l'équipe qui l'a JOUÉE, pas à celle qui a remporté le pli
    let takerPoints = 0;
    players.forEach((player, idx) => {
        const trickWonByTaker = idx === takerIndex || (partnerIndex !== undefined && idx === partnerIndex);
        player.tricksWon.forEach(trick => {
            trick.forEach(tc => {
                if (tc.card.isExcuse) {
                    const playedByTaker = tc.playerIndex === takerIndex ||
                        (partnerIndex !== undefined && tc.playerIndex === partnerIndex);
                    if (playedByTaker) takerPoints += tc.card.points;
                } else if (trickWonByTaker) {
                    takerPoints += tc.card.points;
                }
            });
        });
    });
    
    // Ajouter les cartes écartées (sauf pour garde-sans et garde-contre)
    if (contract === 'petite' || contract === 'garde') {
        if (gameState.discardedCards) {
            gameState.discardedCards.forEach(card => {
                takerPoints += card.points;
            });
        }
    } else if (contract === 'garde-sans') {
        // Le chien va à la défense
        if (gameState.dog) {
            gameState.dog.forEach(card => {
                takerPoints -= card.points;
            });
        }
    } else if (contract === 'garde-contre') {
        // Le chien va au preneur
        if (gameState.dog) {
            gameState.dog.forEach(card => {
                takerPoints += card.points;
            });
        }
    }
    
    // Compter les bouts
    const takerBouts = countBoutsForTeam(players, takerIndex, partnerIndex);
    
    // Points requis
    const requiredPoints = getRequiredPoints(takerBouts, maxPlayers);
    
    // Différence
    const difference = takerPoints - requiredPoints;
    
    // Bonus petit au bout
    let petitBonus = 0;
    if (petitAuBout) {
        petitBonus = petitAuBoutWinner === 'taker' ? 10 : -10;
    }
    
    // Score de base
    let baseScore = 25 + Math.abs(difference) + petitBonus;
    
    // Appliquer le multiplicateur
    const multiplier = getContractMultiplier(contract);
    let finalScore = baseScore * multiplier;
    
    // Si le contrat est chuté, inverser le score
    if (difference < 0) {
        finalScore = -finalScore;
    }
    
    // Distribuer les scores selon le nombre de joueurs
    const scores = [];
    
    if (maxPlayers === 3) {
        // À 3 joueurs, le preneur joue seul contre 2
        players.forEach((player, idx) => {
            if (idx === takerIndex) {
                scores.push({
                    name: player.name,
                    score: finalScore * 2, // Le preneur gagne/perd x2
                    isTaker: true,
                    isPartner: false
                });
            } else {
                scores.push({
                    name: player.name,
                    score: -finalScore,
                    isTaker: false,
                    isPartner: false
                });
            }
        });
    } else if (maxPlayers === 4) {
        // À 4 joueurs, le preneur joue seul contre 3
        players.forEach((player, idx) => {
            if (idx === takerIndex) {
                scores.push({
                    name: player.name,
                    score: finalScore * 3, // Le preneur gagne/perd x3
                    isTaker: true,
                    isPartner: false
                });
            } else {
                scores.push({
                    name: player.name,
                    score: -finalScore,
                    isTaker: false,
                    isPartner: false
                });
            }
        });
    } else if (maxPlayers === 5) {
        // À 5 joueurs : vérifier si le preneur joue seul
        // (roi appelé dans sa main ou dans le chien)
        const takerAlone = partnerIndex === undefined || partnerIndex === takerIndex;

        if (takerAlone) {
            // Le preneur joue seul contre 4 défenseurs
            players.forEach((player, idx) => {
                if (idx === takerIndex) {
                    scores.push({
                        name: player.name,
                        score: finalScore * 4,
                        isTaker: true,
                        isPartner: false
                    });
                } else {
                    scores.push({
                        name: player.name,
                        score: -finalScore,
                        isTaker: false,
                        isPartner: false
                    });
                }
            });
        } else {
            // Le preneur a un partenaire
            players.forEach((player, idx) => {
                if (idx === takerIndex) {
                    scores.push({
                        name: player.name,
                        score: finalScore * 2,
                        isTaker: true,
                        isPartner: false
                    });
                } else if (idx === partnerIndex) {
                    scores.push({
                        name: player.name,
                        score: finalScore,
                        isTaker: false,
                        isPartner: true
                    });
                } else {
                    scores.push({
                        name: player.name,
                        score: -finalScore,
                        isTaker: false,
                        isPartner: false
                    });
                }
            });
        }
    }
    
    return {
        scores,
        takerPoints,
        requiredPoints,
        difference,
        contractSuccess: difference >= 0
    };
}

// Compter les bouts de l'équipe du preneur
// L'Excuse appartient à l'équipe qui l'a JOUÉE (tc.playerIndex)
// Le Petit (1) et le 21 appartiennent à l'équipe qui a remporté le pli
function countBoutsForTeam(players, takerIndex, partnerIndex) {
    let bouts = 0;

    players.forEach((player, idx) => {
        const trickWonByTaker = idx === takerIndex || (partnerIndex !== undefined && idx === partnerIndex);
        player.tricksWon.forEach(trick => {
            trick.forEach(tc => {
                if (tc.card.isExcuse) {
                    const playedByTaker = tc.playerIndex === takerIndex ||
                        (partnerIndex !== undefined && tc.playerIndex === partnerIndex);
                    if (playedByTaker) bouts++;
                } else if (tc.card.isTrump && (tc.card.value === '1' || tc.card.value === '21')) {
                    if (trickWonByTaker) bouts++;
                }
            });
        });
    });

    return bouts;
}

module.exports = {
    calculateFinalScores,
    countBoutsForTeam
};
