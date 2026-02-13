// Gestion du chien et de l'écart
const { getRoom } = require('../room-manager');

function handleDogEvents(io, socket) {
    
    socket.on('setDog', ({ roomCode, dogCards }) => {
        const room = getRoom(roomCode);
        if (!room || !room.gameState) return;

        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== room.gameState.takerIndex) return;

        // Stocker l'écart
        room.gameState.discardedCards = dogCards;

        // Retirer les cartes écartées de la main du preneur
        const player = room.players[playerIndex];
        dogCards.forEach(dogCard => {
            const index = player.hand.findIndex(c => 
                c.suit === dogCard.suit && c.value === dogCard.value
            );
            if (index !== -1) {
                player.hand.splice(index, 1);
            }
        });

        // Renvoyer la main mise à jour au preneur
        io.to(socket.id).emit('dogSet', {
            updatedHand: player.hand
        });

        // À 5 joueurs, le Roi a déjà été appelé AVANT le chien
        // On commence directement à jouer
        room.gameState.phase = 'playing';
        room.gameState.currentPlayerIndex = 0; // Le premier joueur commence
        
        // Envoyer à chaque joueur sa main mise à jour
        room.players.forEach((p, idx) => {
            io.to(p.id).emit('startPlaying', {
                hand: p.hand
            });
        });
        
        console.log(`🎴 ${player.name} a validé son écart`);
    });
}

module.exports = {
    handleDogEvents
};
