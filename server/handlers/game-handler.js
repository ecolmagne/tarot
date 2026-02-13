// Gestion du démarrage de partie
const { getRoom } = require('../room-manager');
const { createDeck, shuffleDeck, dealCards, sortHand } = require('../deck-utils');

function handleGameEvents(io, socket) {
    
    socket.on('startGame', ({ roomCode }) => {
        const room = getRoom(roomCode);
        if (!room) return;
        
        // Vérifier que tous les joueurs sont présents
        if (room.players.length !== room.maxPlayers) {
            socket.emit('error', { message: 'Tous les joueurs ne sont pas encore là' });
            return;
        }
        
        // Créer et mélanger le jeu
        const deck = createDeck();
        shuffleDeck(deck);
        
        // Distribuer les cartes
        const { hands, dog } = dealCards(deck, room.maxPlayers);
        
        // Assigner les mains
        room.players.forEach((player, index) => {
            player.hand = sortHand(hands[index]);
            player.tricksWon = [];
        });
        
        // Initialiser l'état du jeu
        room.gameState = {
            phase: 'bidding',
            currentPlayerIndex: 0,
            currentTrick: 0,
            dog: dog,
            bids: [],
            trickCards: [],
            leadSuit: null,
            takerScore: 0,
            defenseScore: 0
        };
        
        // Envoyer les cartes à chaque joueur
        room.players.forEach((player, index) => {
            io.to(player.id).emit('gameStarted', {
                hand: player.hand,
                gameState: {
                    phase: room.gameState.phase,
                    currentPlayerIndex: room.gameState.currentPlayerIndex,
                    currentTrick: room.gameState.currentTrick
                },
                players: room.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    isHost: p.isHost
                }))
            });
        });
        
        // Démarrer la phase d'enchères
        io.to(roomCode).emit('biddingPhase', {
            currentPlayerIndex: 0
        });
        
        console.log(`🎮 Partie démarrée dans la salle ${roomCode}`);
    });
}

module.exports = {
    handleGameEvents
};
