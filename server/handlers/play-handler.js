// Gestion du jeu (jouer des cartes, plis)
const { getRoom } = require('../room-manager');
const { canPlayCard, determineTrickWinner } = require('../game-rules');
const { calculateTrickPoints } = require('../deck-utils');
const { calculateFinalScores } = require('../score-calculator');

function handlePlayEvents(io, socket) {
    
    socket.on('playCard', ({ roomCode, card: cardToPlay }) => {
        const room = getRoom(roomCode);
        if (!room || !room.gameState || room.gameState.phase !== 'playing') return;
        
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== room.gameState.currentPlayerIndex) return;
        
        // TODO: Extraire le code de jeu de cartes de l'ancien server.js
        // Trouver la carte
        // Valider avec canPlayCard
        // Retirer de la main
        // Ajouter au pli
        // Gérer l'Excuse
        // Déterminer le gagnant si pli complet
        // Calculer les scores
        // Vérifier la fin de partie
        
        console.log(`🃏 ${room.players[playerIndex].name} joue une carte`);
    });
}

module.exports = {
    handlePlayEvents
};
