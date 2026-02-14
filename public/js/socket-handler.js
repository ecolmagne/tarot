// Gestion de la connexion Socket.io
let socket = null;

export function initSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connecté au serveur');
    });

    socket.on('disconnect', () => {
        console.log('Déconnecté du serveur');
    });

    return socket;
}

export function getSocket() {
    return socket;
}
