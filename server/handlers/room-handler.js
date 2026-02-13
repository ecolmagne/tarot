// Gestion des événements de salle (créer, rejoindre, quitter)
const {
    createRoom,
    getRoom,
    addPlayerToRoom,
    removePlayerFromRoom,
    isRoomFull,
    generateRoomCode
} = require('../room-manager');

function handleRoomEvents(io, socket) {
    
    // Créer une nouvelle salle
    socket.on('createRoom', ({ playerName, playerCount }) => {
        const roomCode = generateRoomCode();
        
        const player = {
            id: socket.id,
            name: playerName,
            isHost: true,
            hand: [],
            tricksWon: []
        };
        
        const room = createRoom(roomCode, player, playerCount);
        
        socket.join(roomCode);
        
        socket.emit('roomCreated', {
            roomCode: roomCode,
            players: room.players,
            maxPlayers: room.maxPlayers
        });
        
        console.log(`🎴 Salle créée: ${roomCode} par ${playerName}`);
    });
    
    // Rejoindre une salle
    socket.on('joinRoom', ({ playerName, roomCode }) => {
        const room = getRoom(roomCode);
        
        if (!room) {
            socket.emit('error', { message: 'Cette partie n\'existe pas' });
            return;
        }
        
        if (isRoomFull(roomCode)) {
            socket.emit('error', { message: 'Cette partie est complète' });
            return;
        }
        
        const player = {
            id: socket.id,
            name: playerName,
            isHost: false,
            hand: [],
            tricksWon: []
        };
        
        addPlayerToRoom(roomCode, player);
        socket.join(roomCode);
        
        // Informer le nouveau joueur
        socket.emit('roomJoined', {
            roomCode: roomCode,
            players: room.players,
            maxPlayers: room.maxPlayers
        });
        
        // Informer les autres joueurs
        socket.to(roomCode).emit('playerJoined', {
            players: room.players
        });
        
        console.log(`👤 ${playerName} a rejoint la salle ${roomCode}`);
    });
    
    // Quitter une salle
    socket.on('leaveRoom', ({ roomCode }) => {
        const room = getRoom(roomCode);
        if (!room) return;
        
        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;
        
        const updatedRoom = removePlayerFromRoom(roomCode, socket.id);
        socket.leave(roomCode);
        
        if (updatedRoom) {
            io.to(roomCode).emit('playerLeft', {
                players: updatedRoom.players
            });
            
            console.log(`👤 ${player.name} a quitté la salle ${roomCode}`);
        } else {
            console.log(`🗑️  Salle ${roomCode} supprimée (vide)`);
        }
    });
    
    // Redémarrer une partie
    socket.on('restartGame', ({ roomCode }) => {
        const room = getRoom(roomCode);
        if (!room) return;
        
        room.gameState = null;
        const firstPlayer = room.players.shift();
        room.players.push(firstPlayer);
        
        room.players.forEach(player => {
            player.hand = [];
            player.tricksWon = [];
        });
        
        io.to(roomCode).emit('returnToLobby', {
            players: room.players
        });
        
        console.log(`🔄 Partie redémarrée dans la salle ${roomCode}`);
    });
}

module.exports = {
    handleRoomEvents
};
