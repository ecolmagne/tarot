// État global de l'application
export const state = {
    playerName: '',
    roomCode: '',
    playerId: null,
    playerCount: 4,
    isHost: false,
    players: [],
    gameState: null,
    myHand: [],
    playedCards: [],
    currentTrick: 0,
    selectedDogCards: [],
    dogCards: [],
    currentBids: [],
    lastTrickCards: null
};

// Réinitialiser l'état
export function resetState() {
    state.roomCode = '';
    state.playerId = null;
    state.isHost = false;
    state.players = [];
    state.gameState = null;
    state.myHand = [];
    state.playedCards = [];
    state.currentTrick = 0;
    state.selectedDogCards = [];
    state.dogCards = [];
    state.currentBids = [];
    state.lastTrickCards = null;
}

// Utilitaires pour l'état
export function setPlayerInfo(name, id) {
    state.playerName = name;
    state.playerId = id;
}

export function setRoomInfo(code, isHost) {
    state.roomCode = code;
    state.isHost = isHost;
}

export function updateGameState(newGameState) {
    state.gameState = {
        ...state.gameState,
        ...newGameState
    };
}
