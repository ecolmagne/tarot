// Serveur Tarot - Point d'entrée principal
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const { initSocketHandlers } = require('./server/socket-handlers');
const { rooms } = require('./server/room-manager');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tarot.html'));
});

// Initialiser les gestionnaires Socket.io
initSocketHandlers(io);

// Démarrer le serveur
server.listen(PORT, () => {
    console.log('🎴 Serveur Tarot démarré');
    console.log(`🌐 Accessible sur http://localhost:${PORT}`);
    console.log(`📊 Salles actives : ${rooms.size}`);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
    console.log('🛑 Arrêt du serveur...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});

module.exports = { app, server, io };
