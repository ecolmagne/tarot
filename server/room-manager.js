// Gestionnaire des salles de jeu
const rooms = new Map();

// Créer une nouvelle salle
function createRoom(roomCode, hostPlayer, maxPlayers) {
    const room = {
        code: roomCode,
        maxPlayers: maxPlayers,
        players: [hostPlayer],
        gameState: null,
        host: hostPlayer.id
    };
    
    rooms.set(roomCode, room);
    return room;
}

// Obtenir une salle
function getRoom(roomCode) {
    return rooms.get(roomCode);
}

// Supprimer une salle
function deleteRoom(roomCode) {
    return rooms.delete(roomCode);
}

// Ajouter un joueur à une salle
function addPlayerToRoom(roomCode, player) {
    const room = rooms.get(roomCode);
    if (!room) return null;
    
    if (room.players.length >= room.maxPlayers) {
        return null; // Salle pleine
    }
    
    room.players.push(player);
    return room;
}

// Retirer un joueur d'une salle
function removePlayerFromRoom(roomCode, playerId) {
    const room = rooms.get(roomCode);
    if (!room) return null;
    
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return null;
    
    room.players.splice(playerIndex, 1);
    
    // Si le host part, assigner un nouveau host
    if (room.host === playerId && room.players.length > 0) {
        room.host = room.players[0].id;
        room.players[0].isHost = true;
    }
    
    // Supprimer la salle si elle est vide
    if (room.players.length === 0) {
        rooms.delete(roomCode);
        return null;
    }
    
    return room;
}

// Vérifier si une salle est pleine
function isRoomFull(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return false;
    return room.players.length >= room.maxPlayers;
}

// Générer un code de salle unique
function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    
    do {
        code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
    } while (rooms.has(code));
    
    return code;
}

// Obtenir le nombre de salles actives
function getRoomsCount() {
    return rooms.size;
}

// Obtenir toutes les salles (pour debug)
function getAllRooms() {
    return Array.from(rooms.values());
}

module.exports = {
    rooms,
    createRoom,
    getRoom,
    deleteRoom,
    addPlayerToRoom,
    removePlayerFromRoom,
    isRoomFull,
    generateRoomCode,
    getRoomsCount,
    getAllRooms
};
