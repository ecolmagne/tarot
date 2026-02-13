// Gestion des enchères
const { getRoom } = require('../room-manager');

function handleBiddingEvents(io, socket) {
    
    socket.on('makeBid', ({ roomCode, bid }) => {
        const room = getRoom(roomCode);
        if (!room || !room.gameState) return;
        
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== room.gameState.currentPlayerIndex) return;
        
        // Enregistrer l'enchère
        room.gameState.bids.push({ playerIndex, bid });
        
        // TODO: Extraire le code de gestion des enchères de l'ancien server.js
        // Gérer garde-contre (arrêt immédiat)
        // Incrémenter currentPlayerIndex
        // Vérifier si tous ont enchéri
        // Déterminer le preneur
        // Afficher le chien à tous
        // Gérer le chien selon le contrat
        
        console.log(`💰 ${room.players[playerIndex].name} : ${bid}`);
    });
}

module.exports = {
    handleBiddingEvents
};
