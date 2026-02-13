// Gestion de l'appel de Roi (5 joueurs)
const { getRoom } = require('../room-manager');

function handleKingCallEvents(io, socket) {
    
    socket.on('callKing', ({ roomCode, suit }) => {
        const room = getRoom(roomCode);
        if (!room || !room.gameState) return;

        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== room.gameState.takerIndex) return;

        const calledKing = `Roi de ${suit}`;
        room.gameState.calledKingSuit = suit;
        room.gameState.calledKing = calledKing;

        // Trouver qui a ce Roi
        room.players.forEach((player, idx) => {
            const hasKing = player.hand.some(c => c.value === 'R' && c.suit === suit);
            if (hasKing) {
                room.gameState.partnerIndex = idx;
                player.isPartner = true;
            }
        });

        // Annoncer le Roi appelé à tous
        io.to(roomCode).emit('kingCalled', {
            suit: suit,
            calledKing: calledKing
        });

        // Donner le chien au preneur après l'appel (pour Petite et Garde)
        if (room.gameState.contract === 'petite' || room.gameState.contract === 'garde') {
            setTimeout(() => {
                // Ajouter le chien à la main du preneur côté serveur
                room.players[playerIndex].hand = room.players[playerIndex].hand.concat(room.gameState.dog);
                
                io.to(room.players[playerIndex].id).emit('receiveDog', {
                    dogCards: room.gameState.dog
                });
                
                // Informer les autres joueurs
                room.players.forEach((player, idx) => {
                    if (idx !== playerIndex) {
                        io.to(player.id).emit('waitingForDog', {});
                    }
                });
            }, 2000);
        } else {
            // Pour Garde sans et Garde contre, commencer à jouer
            setTimeout(() => {
                room.gameState.phase = 'playing';
                room.gameState.currentPlayerIndex = 0; // Le premier joueur commence
                
                // Envoyer à chaque joueur sa main
                room.players.forEach((player, idx) => {
                    io.to(player.id).emit('startPlaying', {
                        hand: player.hand
                    });
                });
            }, 2000);
        }
        
        console.log(`👑 ${room.players[playerIndex].name} a appelé le ${calledKing}`);
    });
}

module.exports = {
    handleKingCallEvents
};
