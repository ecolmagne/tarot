// Gestion de l'interface utilisateur
import { state } from './state.js';
import { getSocket } from './socket-handler.js';
import { sortHand, createCardElement, renderPlayerHand } from './card-utils.js';

export function initUI() {
    const socket = getSocket();

    // Partie créée
    socket.on('roomCreated', ({ roomCode, playerId, players, maxPlayers }) => {
        state.roomCode = roomCode;
        state.playerId = playerId;
        state.players = players;
        state.playerCount = maxPlayers;
        showLobby();
    });

    // Partie rejointe
    socket.on('roomJoined', ({ roomCode, playerId, players, maxPlayers }) => {
        state.roomCode = roomCode;
        state.playerId = playerId;
        state.players = players;
        state.playerCount = maxPlayers;
        showLobby();
    });

    // Un joueur a rejoint
    socket.on('playerJoined', ({ players }) => {
        state.players = players;
        updatePlayersList();
        if (state.isHost) {
            checkStartGameButton();
        }
    });

    // Un joueur a quitté
    socket.on('playerLeft', ({ players }) => {
        state.players = players;
        updatePlayersList();
        if (state.isHost) {
            checkStartGameButton();
        }
    });

    // La partie a démarré
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

        showMessage('La partie commence !');
    });

    // Début de la phase de jeu
    socket.on('startPlaying', ({ hand }) => {
        showMessage('C\'est parti !');
        state.currentTrick = 1;

        if (hand) {
            state.myHand = hand;
            sortHand(state.myHand);
        }

        setTimeout(() => {
            showGameScreen();
        }, 1500);
    });

    // Retour au lobby pour une nouvelle partie
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
        showMessage('Prêt pour une nouvelle partie !');
    });

    // Tous les joueurs ont passé
    socket.on('allPassed', () => {
        state.currentBids = [];
        showMessage('Tous les joueurs ont passé. Nouvelle donne...');
    });

    // Erreur
    socket.on('error', ({ message }) => {
        showMessage('Erreur : ' + message);
    });
}

// Afficher un message temporaire
export function showMessage(message, duration = 3000) {
    const banner = document.getElementById('messageBanner');
    banner.textContent = message;
    banner.classList.add('show');
    setTimeout(() => {
        banner.classList.remove('show');
    }, duration);
}

function selectPlayerCount(count) {
    state.playerCount = count;
    document.querySelectorAll('.player-count-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (parseInt(btn.dataset.count) === count) {
            btn.classList.add('selected');
        }
    });
}

function createRoom() {
    const name = document.getElementById('playerName').value.trim();
    if (!name) {
        showMessage('Veuillez entrer votre nom');
        return;
    }

    state.playerName = name;
    state.isHost = true;

    const socket = getSocket();
    socket.emit('createRoom', {
        playerName: name,
        playerCount: state.playerCount
    });
}

function showJoinRoom() {
    document.getElementById('joinRoomDiv').classList.remove('hidden');
}

function joinRoom() {
    const name = document.getElementById('playerName').value.trim();
    const code = document.getElementById('roomCode').value.trim().toUpperCase();

    if (!name) {
        showMessage('Veuillez entrer votre nom');
        return;
    }

    if (!code) {
        showMessage('Veuillez entrer le code de la partie');
        return;
    }

    state.playerName = name;

    const socket = getSocket();
    socket.emit('joinRoom', {
        playerName: name,
        roomCode: code
    });
}

function showLobby() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('lobbyScreen').style.display = 'block';
    document.getElementById('displayRoomCode').textContent = state.roomCode;

    const shareLink = window.location.origin + window.location.pathname + '?room=' + state.roomCode;
    document.getElementById('shareLink').textContent = shareLink;

    updatePlayersList();

    if (state.isHost) {
        checkStartGameButton();
    }
}

function updatePlayersList() {
    const listDiv = document.getElementById('playersList');
    listDiv.innerHTML = '<h3>Joueurs (' + state.players.length + '/' + state.playerCount + ')</h3>';

    state.players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-item';
        item.innerHTML = `
            <div class="player-avatar">${player.name.charAt(0).toUpperCase()}</div>
            <div>${player.name}${player.isHost ? ' \u{1F451}' : ''}</div>
        `;
        listDiv.appendChild(item);
    });
}

function checkStartGameButton() {
    const btnDiv = document.getElementById('startGameBtn');

    if (state.players.length === state.playerCount) {
        btnDiv.classList.remove('hidden');
    } else {
        btnDiv.classList.add('hidden');
    }
}

function copyShareLink() {
    const link = document.getElementById('shareLink').textContent;
    navigator.clipboard.writeText(link).then(() => {
        showMessage('Lien copié !');
    });
}

function leaveRoom() {
    const socket = getSocket();
    socket.emit('leaveRoom', { roomCode: state.roomCode });
    backToWelcome();
}

function startGame() {
    const socket = getSocket();
    socket.emit('startGame', { roomCode: state.roomCode });
}

export function showWaitingDogScreen() {
    document.getElementById('biddingScreen').style.display = 'none';
    document.getElementById('kingCallScreen').style.display = 'none';
    document.getElementById('waitingDogScreen').style.display = 'block';

    // Afficher le roi appelé si à 5 joueurs
    const calledKingWaiting = document.getElementById('calledKingWaiting');
    if (calledKingWaiting && state.gameState && state.gameState.calledKing) {
        calledKingWaiting.textContent = state.gameState.calledKing;
        document.getElementById('calledKingWaitingInfo').style.display = 'block';
    }

    // Afficher les cartes du chien
    const container = document.getElementById('waitingDogCards');
    container.innerHTML = '';
    if (state.dogCards) {
        state.dogCards.forEach(card => {
            const cardDiv = createCardElement(card, false);
            cardDiv.style.width = '60px';
            cardDiv.style.height = '90px';
            cardDiv.onclick = null;
            cardDiv.style.cursor = 'default';
            container.appendChild(cardDiv);
        });
    }

    // Afficher la main du joueur (lecture seule)
    const handContainer = document.getElementById('waitingDogPlayerHand');
    handContainer.innerHTML = '';
    document.getElementById('waitingDogHandCount').textContent = state.myHand.length;
    state.myHand.forEach(card => {
        const cardDiv = createCardElement(card, true);
        cardDiv.onclick = null;
        cardDiv.style.cursor = 'default';
        handContainer.appendChild(cardDiv);
    });
}

export function showGameScreen() {
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('biddingScreen').style.display = 'none';
    document.getElementById('dogScreen').style.display = 'none';
    document.getElementById('waitingDogScreen').style.display = 'none';
    document.getElementById('kingCallScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';

    // Nettoyer les résidus de la partie précédente
    document.getElementById('centerArea').innerHTML = '';
    document.getElementById('lastTrickDisplay').classList.add('hidden');
    document.getElementById('debugSkipBtn').style.display = 'none';

    updateGameHeader();
    renderOpponents();
    renderPlayerHand();
}

export function updateGameHeader() {
    if (!state.gameState) return;

    document.getElementById('contract').textContent = state.gameState.contract || '-';
    document.getElementById('taker').textContent = state.gameState.taker || '-';
}

export function renderOpponents() {
    const area = document.getElementById('playersArea');
    area.innerHTML = '';

    const myIndex = state.players.findIndex(p => p.id === state.playerId);
    if (myIndex === -1) return;

    const positions = calculatePlayerPositions(state.players.length, myIndex);

    state.players.forEach((player, index) => {
        if (index === myIndex) return;

        const pos = positions[index];
        if (!pos) return;

        const isCurrentPlayer = state.gameState && index === state.gameState.currentPlayerIndex;
        const cardCount = player.cardCount !== undefined ? player.cardCount : (state.myHand.length || '?');

        const div = document.createElement('div');
        div.className = 'opponent' + (isCurrentPlayer ? ' current-player' : '');
        div.style.cssText = `position: absolute; ${pos}`;
        div.innerHTML = `
            <div class="opponent-name">${player.name}</div>
            <div class="opponent-cards">${cardCount} cartes</div>
        `;
        area.appendChild(div);
    });
}

function calculatePlayerPositions(totalPlayers, myIndex) {
    const positions = {};
    const otherPlayers = [];

    for (let i = 1; i < totalPlayers; i++) {
        const idx = (myIndex + i) % totalPlayers;
        otherPlayers.push(idx);
    }

    if (totalPlayers === 3) {
        if (otherPlayers[0] !== undefined) positions[otherPlayers[0]] = 'left: 5%; top: 40%;';
        if (otherPlayers[1] !== undefined) positions[otherPlayers[1]] = 'right: 5%; top: 40%;';
    } else if (totalPlayers === 4) {
        if (otherPlayers[0] !== undefined) positions[otherPlayers[0]] = 'left: 5%; top: 40%;';
        if (otherPlayers[1] !== undefined) positions[otherPlayers[1]] = 'left: 50%; top: 5%; transform: translateX(-50%);';
        if (otherPlayers[2] !== undefined) positions[otherPlayers[2]] = 'right: 5%; top: 40%;';
    } else if (totalPlayers === 5) {
        if (otherPlayers[0] !== undefined) positions[otherPlayers[0]] = 'left: 5%; top: 50%;';
        if (otherPlayers[1] !== undefined) positions[otherPlayers[1]] = 'left: 15%; top: 5%;';
        if (otherPlayers[2] !== undefined) positions[otherPlayers[2]] = 'right: 15%; top: 5%;';
        if (otherPlayers[3] !== undefined) positions[otherPlayers[3]] = 'right: 5%; top: 50%;';
    }

    return positions;
}

function leaveGame() {
    if (confirm('Voulez-vous vraiment quitter la partie ?')) {
        backToWelcome();
    }
}

function backToWelcome() {
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('biddingScreen').style.display = 'none';
    document.getElementById('dogScreen').style.display = 'none';
    document.getElementById('waitingDogScreen').style.display = 'none';
    document.getElementById('kingCallScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('scoresScreen').style.display = 'none';
    document.getElementById('welcomeScreen').style.display = 'block';

    state.roomCode = '';
    state.playerId = null;
    state.isHost = false;
    state.players = [];
    state.gameState = null;
    state.myHand = [];
}

function startNewGame() {
    const socket = getSocket();
    socket.emit('restartGame', { roomCode: state.roomCode });

    document.getElementById('scoresScreen').style.display = 'none';
    document.getElementById('lobbyScreen').style.display = 'block';

    showMessage('Nouvelle partie lancée !');
}

// Exposer les fonctions globalement pour les onclick HTML
window.selectPlayerCount = selectPlayerCount;
window.createRoom = createRoom;
window.showJoinRoom = showJoinRoom;
window.joinRoom = joinRoom;
window.copyShareLink = copyShareLink;
window.startGame = startGame;
window.leaveRoom = leaveRoom;
window.leaveGame = leaveGame;
window.backToWelcome = backToWelcome;
window.startNewGame = startNewGame;
