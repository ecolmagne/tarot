// Gestion de la connexion Socket.io
import { state } from './state.js';

let socket = null;

export function initSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('✅ Connecté au serveur');
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Déconnecté du serveur');
    });
    
    socket.on('error', ({ message }) => {
        console.error('Erreur serveur:', message);
        showMessage('❌ ' + message);
    });
    
    return socket;
}

export function getSocket() {
    return socket;
}

// Fonctions de gestion des salles
export function createRoom(playerName, playerCount) {
    socket.emit('createRoom', {
        playerName: playerName,
        playerCount: playerCount
    });
}

export function joinRoom(playerName, roomCode) {
    socket.emit('joinRoom', {
        playerName: playerName,
        roomCode: roomCode
    });
}

export function startGame() {
    socket.emit('startGame', {
        roomCode: state.roomCode
    });
}

export function leaveRoom() {
    socket.emit('leaveRoom', {
        roomCode: state.roomCode
    });
}

export function restartGame() {
    socket.emit('restartGame', {
        roomCode: state.roomCode
    });
}

// Helper pour afficher des messages
function showMessage(message, duration = 3000) {
    const banner = document.getElementById('messageBanner');
    if (banner) {
        banner.textContent = message;
        banner.classList.add('show');
        setTimeout(() => {
            banner.classList.remove('show');
        }, duration);
    }
}
