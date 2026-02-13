// Gestionnaire principal des événements Socket.io
const { handleRoomEvents } = require('./handlers/room-handler');
const { handleGameEvents } = require('./handlers/game-handler');
const { handleBiddingEvents } = require('./handlers/bidding-handler');
const { handleDogEvents } = require('./handlers/dog-handler');
const { handleKingCallEvents } = require('./handlers/king-call-handler');
const { handlePlayEvents } = require('./handlers/play-handler');

function initSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('🔌 Nouveau client connecté:', socket.id);

        // Gestion des salles (créer, rejoindre, quitter)
        handleRoomEvents(io, socket);

        // Gestion du démarrage de partie
        handleGameEvents(io, socket);

        // Gestion des enchères
        handleBiddingEvents(io, socket);

        // Gestion du chien et de l'écart
        handleDogEvents(io, socket);

        // Gestion de l'appel de Roi (5 joueurs)
        handleKingCallEvents(io, socket);

        // Gestion du jeu (jouer des cartes, plis)
        handlePlayEvents(io, socket);

        // Déconnexion
        socket.on('disconnect', () => {
            console.log('🔌 Client déconnecté:', socket.id);
        });
    });
}

module.exports = {
    initSocketHandlers
};
