// Calculateur de scores
const { getRequiredPoints, getContractMultiplier, countBouts } = require('./game-rules');
const { calculateTrickPoints } = require('./deck-utils');

// Calculer les scores de fin de partie
function calculateFinalScores(room) {
    const { gameState, players, maxPlayers } = room;
    const { takerIndex, partnerIndex, contract, petitAuBout, petitAuBoutWinner } = gameState;
    
    // Compter les points du preneur
    let takerPoints = 0;
    players.forEach((player, idx) => {
        const isTakerTeam = idx === takerIndex || (partnerIndex !== undefined && idx === partnerIndex);
        if (isTakerTeam) {
            player.tricksWon.forEach(trick => {
                takerPoints += calculateTrickPoints(trick);
            });
        }
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
        // À 5 joueurs, le preneur a un partenaire
        players.forEach((player, idx) => {
            if (idx === takerIndex) {
                scores.push({
                    name: player.name,
                    score: finalScore * 2, // Le preneur gagne/perd x2
                    isTaker: true,
                    isPartner: false
                });
            } else if (partnerIndex !== undefined && idx === partnerIndex) {
                scores.push({
                    name: player.name,
                    score: finalScore, // Le partenaire gagne/perd x1
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
    
    return {
        scores,
        takerPoints,
        requiredPoints,
        difference,
        contractSuccess: difference >= 0
    };
}

// Compter les bouts de l'équipe du preneur
function countBoutsForTeam(players, takerIndex, partnerIndex) {
    let bouts = 0;
    
    players.forEach((player, idx) => {
        const isTakerTeam = idx === takerIndex || (partnerIndex !== undefined && idx === partnerIndex);
        if (isTakerTeam) {
            player.tricksWon.forEach(trick => {
                trick.forEach(tc => {
                    if (tc.card.isExcuse) bouts++;
                    if (tc.card.isTrump && (tc.card.value === '1' || tc.card.value === '21')) bouts++;
                });
            });
        }
    });
    
    return bouts;
}

module.exports = {
    calculateFinalScores,
    countBoutsForTeam
};
