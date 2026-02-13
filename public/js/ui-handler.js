// Gestion de l'interface utilisateur
import { state, resetState, setPlayerInfo, setRoomInfo } from './state.js';
import { getSocket, createRoom, joinRoom, startGame, leaveRoom, restartGame } from './socket-handler.js';

export function initUI() {
    const socket = getSocket();
    
    // Gestion de la création/rejoindre une salle
    setupWelcomeScreen();
    setupLobbyScreen();
    
    // Événements Socket.io
    socket.on('roomCreated', ({ roomCode, players, maxPlayers }) => {
        setRoomInfo(roomCode, true);
        state.players = players;
        state.playerCount = maxPlayers;
        showLobbyScreen();
        updatePlayersList();
        showMessage(`✅ Partie créée ! Code : ${roomCode}`);
    });
    
    socket.on('roomJoined', ({ roomCode, players, maxPlayers }) => {
        setRoomInfo(roomCode, false);
        state.players = players;
        state.playerCount = maxPlayers;
        showLobbyScreen();
        updatePlayersList();
        showMessage(`✅ Partie rejointe !`);
    });
    
    socket.on('playerJoined', ({ players }) => {
        state.players = players;
        updatePlayersList();
    });
    
    socket.on('playerLeft', ({ players }) => {
        state.players = players;
        updatePlayersList();
    });
    
    socket.on('gameStarted', ({ hand, gameState, players }) => {
        state.myHand = hand;
        state.gameState = {
            ...gameState,
            trickCards: []
        };
        state.players = players;
        state.currentTrick = gameState.currentTrick;
        state.playedCards = [];
        state.currentBids = [];
        
        showMessage('🎴 La partie commence !');
    });
    
    socket.on('returnToLobby', ({ players }) => {
        state.players = players;
        state.gameState = null;
        state.myHand = [];
        state.playedCards = [];
        state.currentTrick = 0;
        state.selectedDogCards = [];
        state.dogCards = [];
        state.currentBids = [];
        state.lastTrickCards = null;
        
        document.getElementById('scoresScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('lobbyScreen').style.display = 'block';
        
        updatePlayersList();
        showMessage('🎮 Prêt pour une nouvelle partie !');
    });
}

function setupWelcomeScreen() {
    // Gestion des boutons de sélection du nombre de joueurs
    document.querySelectorAll('.player-count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectPlayerCount(parseInt(btn.dataset.count));
        });
    });
}

function setupLobbyScreen() {
    // Pas besoin de setup spécifique pour l'instant
}

export function selectPlayerCount(count) {
    state.playerCount = count;
    document.querySelectorAll('.player-count-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (parseInt(btn.dataset.count) === count) {
            btn.classList.add('selected');
        }
    });
}

export function createNewRoom() {
    const nameInput = document.getElementById('playerNameCreate');
    const playerName = nameInput.value.trim();
    
    if (!playerName) {
        showMessage('❌ Veuillez entrer votre nom');
        return;
    }
    
    const playerId = generatePlayerId();
    setPlayerInfo(playerName, playerId);
    
    createRoom(playerName, state.playerCount);
}

export function joinExistingRoom() {
    const nameInput = document.getElementById('playerNameJoin');
    const codeInput = document.getElementById('roomCodeInput');
    
    const playerName = nameInput.value.trim();
    const roomCode = codeInput.value.trim().toUpperCase();
    
    if (!playerName) {
        showMessage('❌ Veuillez entrer votre nom');
        return;
    }
    
    if (!roomCode) {
        showMessage('❌ Veuillez entrer un code de partie');
        return;
    }
    
    const playerId = generatePlayerId();
    setPlayerInfo(playerName, playerId);
    
    joinRoom(playerName, roomCode);
}

export function startGameFromLobby() {
    startGame();
}

export function leaveGame() {
    if (confirm('Voulez-vous vraiment quitter la partie ?')) {
        leaveRoom();
        backToWelcome();
    }
}

export function backToWelcome() {
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('biddingScreen').style.display = 'none';
    document.getElementById('dogScreen').style.display = 'none';
    document.getElementById('kingCallScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('scoresScreen').style.display = 'none';
    document.getElementById('welcomeScreen').style.display = 'block';
    
    resetState();
}

export function startNewGame() {
    restartGame();
    
    document.getElementById('scoresScreen').style.display = 'none';
    document.getElementById('lobbyScreen').style.display = 'block';
    
    showMessage('🔄 Nouvelle partie lancée !');
}

function showLobbyScreen() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('lobbyScreen').style.display = 'block';
    
    document.getElementById('roomCodeDisplay').textContent = state.roomCode;
    
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
        startBtn.style.display = state.isHost ? 'block' : 'none';
    }
}

export function updatePlayersList() {
    const container = document.getElementById('playersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    state.players.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'player-item';
        
        const badge = player.isHost ? ' 👑' : '';
        const youBadge = player.id === state.playerId ? ' (Vous)' : '';
        
        div.innerHTML = `<strong>${player.name}</strong>${badge}${youBadge}`;
        container.appendChild(div);
    });
    
    const countDiv = document.getElementById('playersCount');
    if (countDiv) {
        countDiv.textContent = `${state.players.length}/${state.playerCount}`;
    }
    
    // Activer le bouton démarrer si on a assez de joueurs
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn && state.isHost) {
        const canStart = state.players.length === state.playerCount;
        startBtn.disabled = !canStart;
        startBtn.style.opacity = canStart ? '1' : '0.5';
    }
}

export function showMessage(message, duration = 3000) {
    const banner = document.getElementById('messageBanner');
    if (!banner) return;
    
    banner.textContent = message;
    banner.classList.add('show');
    setTimeout(() => {
        banner.classList.remove('show');
    }, duration);
}

export function updateGameHeader() {
    if (!state.gameState) return;
    
    const contractEl = document.getElementById('contract');
    const takerEl = document.getElementById('taker');
    
    if (contractEl) contractEl.textContent = state.gameState.contract || '-';
    if (takerEl) takerEl.textContent = state.gameState.taker || '-';
}

function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substring(2, 15);
}

// Exposer les fonctions globalement pour les boutons HTML
window.createNewRoom = createNewRoom;
window.joinExistingRoom = joinExistingRoom;
window.startGameFromLobby = startGameFromLobby;
window.leaveGame = leaveGame;
window.backToWelcome = backToWelcome;
window.startNewGame = startNewGame;
window.selectPlayerCount = selectPlayerCount;
