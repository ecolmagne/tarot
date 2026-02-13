// Gestion du chien et de l'écart
const { getRoom } = require('../room-manager');

function handleDogEvents(io, socket) {
    
    socket.on('setDog', ({ roomCode, dogCards }) => {
        const room = getRoom(roomCode);
        if (!room || !room.gameState) return;

        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== room.gameState.takerIndex) return;

        // TODO: Extraire le code de gestion de l'écart de l'ancien server.js
        // Stocker l'écart
        // Retirer les cartes écartées
        // Renvoyer la main mise à jour
        // Commencer le jeu
        
        console.log(`🎴 ${room.players[playerIndex].name} a fait son écart`);
    });
}

module.exports = {
    handleDogEvents
};
