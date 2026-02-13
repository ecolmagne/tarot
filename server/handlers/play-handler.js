// Gestion du jeu (jouer des cartes, plis)
const { getRoom } = require('../room-manager');
const { canPlayCard, determineTrickWinner } = require('../game-rules');
const { calculateTrickPoints } = require('../deck-utils');
const { calculateFinalScores } = require('../score-calculator');

function handlePlayEvents(io, socket) {
    
    socket.on('playCard', ({ roomCode, card: cardToPlay }) => {
        const room = getRoom(roomCode);
        if (!room || !room.gameState || room.gameState.phase !== 'playing') return;

        // Bloquer le jeu entre deux plis
        if (room.gameState.betweenTricks) return;

        const playerIndex = room.players.findIndex(p => p.id === socket.id);

        if (playerIndex !== room.gameState.currentPlayerIndex) {
            socket.emit('error', { message: 'Ce n\'est pas votre tour' });
            return;
        }
        
        const player = room.players[playerIndex];
        
        // Trouver la carte dans la main du joueur par suit et value
        const cardIndex = player.hand.findIndex(c => 
            c.suit === cardToPlay.suit && c.value === cardToPlay.value
        );
        
        if (cardIndex === -1) {
            socket.emit('error', { message: 'Carte invalide - vous ne possédez pas cette carte' });
            return;
        }
        
        const card = player.hand[cardIndex];
        
        // Vérifier si la carte peut être jouée
        if (!canPlayCard(card, player.hand, room.gameState)) {
            socket.emit('error', { message: 'Vous ne pouvez pas jouer cette carte' });
            return;
        }
        
        // Retirer la carte de la main du joueur
        player.hand.splice(cardIndex, 1);
        
        // Ajouter la carte au pli
        room.gameState.trickCards.push({ playerIndex, card });
        
        // Déterminer la couleur demandée
        if (room.gameState.trickCards.length === 1) {
            // Première carte du pli
            if (card.isTrump) {
                room.gameState.leadSuit = 'trump';
            } else if (card.isExcuse) {
                room.gameState.leadSuit = null; // L'excuse ne définit pas de couleur, le joueur suivant choisit
            } else {
                room.gameState.leadSuit = card.suit;
            }
        } else if (room.gameState.trickCards.length === 2 && room.gameState.leadSuit === null) {
            // Deuxième carte après une Excuse en ouverture : cette carte définit la couleur du pli
            if (card.isTrump) {
                room.gameState.leadSuit = 'trump';
            } else if (!card.isExcuse) {
                room.gameState.leadSuit = card.suit;
            }
        }
        
        io.to(roomCode).emit('cardPlayed', {
            playerIndex: playerIndex,
            card: card,
            trickCards: room.gameState.trickCards,
            remainingCards: player.hand.length
        });
        
        // Vérifier si le pli est complet
        if (room.gameState.trickCards.length === room.players.length) {
            // Déterminer le gagnant du pli
            const winnerIndex = determineTrickWinner(room.gameState.trickCards, room.gameState.leadSuit);
            
            // Gérer l'Excuse : elle reste à l'équipe qui l'a jouée
            let excusePlayerIndex = null;
            const excuseCard = room.gameState.trickCards.find((tc, idx) => {
                if (tc.card.isExcuse) {
                    excusePlayerIndex = tc.playerIndex;
                    return true;
                }
                return false;
            });
            
            // Calculer les points sans l'Excuse
            let trickPoints = calculateTrickPoints(room.gameState.trickCards);
            
            // L'Excuse est mise de côté et reste à son équipe
            if (excuseCard) {
                // Retirer les points de l'Excuse du pli
                trickPoints -= excuseCard.card.points;
                
                // L'Excuse va à l'équipe qui l'a jouée
                const excuseToTaker = (excusePlayerIndex === room.gameState.takerIndex || 
                                      (room.gameState.partnerIndex !== undefined && excusePlayerIndex === room.gameState.partnerIndex));
                
                if (excuseToTaker) {
                    room.gameState.takerScore += excuseCard.card.points;
                } else {
                    room.gameState.defenseScore += excuseCard.card.points;
                }
            }
            
            // Ajouter le pli au gagnant
            room.players[winnerIndex].tricksWon.push(room.gameState.trickCards);
            
            // Vérifier le petit au bout (1 d'atout au dernier pli)
            const isLastTrick = room.players[0].hand.length === 0;
            if (isLastTrick) {
                const hasPetit = room.gameState.trickCards.some(tc => 
                    tc.card.isTrump && tc.card.value === '1'
                );
                
                if (hasPetit) {
                    room.gameState.petitAuBout = true;
                    const isTakerWin = (winnerIndex === room.gameState.takerIndex || 
                                      (room.gameState.partnerIndex !== undefined && winnerIndex === room.gameState.partnerIndex));
                    room.gameState.petitAuBoutWinner = isTakerWin ? 'taker' : 'defense';
                }
            }
            
            // Mettre à jour les scores
            const isTakerTrick = (winnerIndex === room.gameState.takerIndex || 
                                 (room.gameState.partnerIndex !== undefined && winnerIndex === room.gameState.partnerIndex));
            
            if (isTakerTrick) {
                room.gameState.takerScore += trickPoints;
            } else {
                room.gameState.defenseScore += trickPoints;
            }
            
            // Bloquer le jeu pendant la transition entre plis
            room.gameState.betweenTricks = true;

            // Annoncer le gagnant du pli
            io.to(roomCode).emit('trickComplete', {
                winnerIndex: winnerIndex,
                winnerName: room.players[winnerIndex].name,
                trickPoints: trickPoints,
                takerScore: room.gameState.takerScore,
                defenseScore: room.gameState.defenseScore
            });

            // Vérifier si c'est le dernier pli
            if (isLastTrick) {
                // Calculer les scores finaux
                const result = calculateFinalScores(room);
                
                setTimeout(() => {
                    io.to(roomCode).emit('gameFinished', {
                        scores: result.scores,
                        takerScore: result.takerPoints,
                        defenseScore: 91 - result.takerPoints,
                        contract: room.gameState.contract,
                        takerName: room.gameState.taker
                    });
                }, 3000);
                
                console.log(`🏁 Partie terminée dans ${roomCode}`);
            } else {
                // Passer au pli suivant
                room.gameState.currentTrick++;
                const lastTrickCards = room.gameState.trickCards;
                
                room.gameState.trickCards = [];
                room.gameState.leadSuit = null;
                room.gameState.currentPlayerIndex = winnerIndex;
                
                setTimeout(() => {
                    room.gameState.betweenTricks = false;
                    io.to(roomCode).emit('newTrick', {
                        currentPlayerIndex: winnerIndex,
                        currentTrick: room.gameState.currentTrick,
                        lastTrickCards: lastTrickCards
                    });
                }, 3000);
            }
        } else {
            // Passer au joueur suivant
            room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % room.players.length;
            
            io.to(roomCode).emit('nextPlayer', {
                currentPlayerIndex: room.gameState.currentPlayerIndex
            });
        }
    });
}

module.exports = {
    handlePlayEvents
};
