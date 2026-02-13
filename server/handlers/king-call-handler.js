// Gestion de l'appel de Roi (5 joueurs)
const { getRoom } = require('../room-manager');

function handleKingCallEvents(io, socket) {
    
    socket.on('callKing', ({ roomCode, suit }) => {
        const room = getRoom(roomCode);
        if (!room || !room.gameState) return;

        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== room.gameState.takerIndex) return;

        // TODO: Extraire le code d'appel de Roi de l'ancien server.js
        // Enregistrer le Roi appelé
        // Trouver le partenaire
        // Annoncer le Roi
        // Donner le chien si Petite/Garde
        // Ou commencer à jouer si Garde sans/contre
        
        console.log(`👑 ${room.players[playerIndex].name} appelle le Roi de ${suit}`);
    });
}

module.exports = {
    handleKingCallEvents
};
