// Serveur principal du jeu de Tarot
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Import des gestionnaires
const { initRoomHandlers } = require('./handlers/room-handler');
const { initBiddingHandlers } = require('./handlers/bidding-handler');
const { initDogHandlers } = require('./handlers/dog-handler');
const { initKingCallHandlers } = require('./handlers/king-call-handler');
const { initGameHandlers } = require('./handlers/game-handler');

// Configuration
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques
app.use(express.static('public'));

// Map pour stocker les parties
const rooms = new Map();

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
    console.log('Nouveau client connecté:', socket.id);

    // Initialiser tous les gestionnaires d'événements
    initRoomHandlers(socket, io, rooms);
    initBiddingHandlers(socket, io, rooms);
    initDogHandlers(socket, io, rooms);
    initKingCallHandlers(socket, io, rooms);
    initGameHandlers(socket, io, rooms);

    // Déconnexion
    socket.on('disconnect', () => {
        console.log('Client déconnecté:', socket.id);
        
        // Nettoyer les parties
        rooms.forEach((room, roomCode) => {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                
                if (room.players.length === 0) {
                    rooms.delete(roomCode);
                } else {
                    const hasHost = room.players.some(p => p.isHost);
                    if (!hasHost) {
                        room.players[0].isHost = true;
                    }
                    
                    io.to(roomCode).emit('playerLeft', {
                        players: room.players
                    });
                }
            }
        });
    });
});

// Démarrer le serveur
server.listen(PORT, () => {
    console.log(`🎴 Serveur Tarot démarré sur le port ${PORT}`);
    console.log(`📡 Socket.io prêt pour les connexions`);
});

// Export pour les tests
module.exports = { app, server, io, rooms };
