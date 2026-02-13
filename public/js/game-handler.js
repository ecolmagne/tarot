// Logique principale du jeu
import { state } from './state.js';
import { getSocket } from './socket-handler.js';
import { showMessage, updateGameHeader } from './ui-handler.js';
import { renderPlayerHand, createCardElement, sortHand } from './card-utils.js';

export function initGame() {
    const socket = getSocket();
    
    // Début de la phase de jeu
    socket.on('startPlaying', ({ hand }) => {
        showMessage('🎮 C\'est parti !');
        state.currentTrick = 1; // Initialiser le premier pli
        
        // Mettre à jour la main si fournie
        if (hand) {
            state.myHand = hand;
            sortHand(state.myHand);
        }
        
        setTimeout(() => {
            showGameScreen();
        }, 1500);
    });
    
    // Une carte a été jouée
    socket.on('cardPlayed', ({ playerIndex, card, trickCards, remainingCards }) => {
        const player = state.players[playerIndex];
        
        // Si c'est le joueur actuel qui a joué
        if (player.id === state.playerId) {
            // Retirer la carte de la main locale
            const cardIndex = state.myHand.findIndex(c => 
                c.suit === card.suit && c.value === card.value
            );
            if (cardIndex !== -1) {
                state.myHand.splice(cardIndex, 1);
            }
        }
        
        state.playedCards.push({ playerIndex, card });
        state.gameState.trickCards = trickCards;
        
        renderPlayedCards();
        renderPlayerHand();
        renderOpponents();
    });
    
    // Joueur suivant
    socket.on('nextPlayer', ({ currentPlayerIndex }) => {
        state.gameState.currentPlayerIndex = currentPlayerIndex;
        renderOpponents();
    });
    
    // Pli terminé
    socket.on('trickComplete', ({ winnerIndex, winnerName, trickPoints, takerScore, defenseScore }) => {
        state.gameState.takerScore = takerScore;
        state.gameState.defenseScore = defenseScore;
        
        const winnerDiv = document.getElementById('trickWinner');
        if (winnerDiv) {
            winnerDiv.innerHTML = `
                <div style="font-size: 1.1em; margin-bottom: 10px;">
                    <strong>${winnerName}</strong> remporte le pli ! 
                    <span style="color: #f39c12;">(+${trickPoints.toFixed(1)} pts)</span>
                </div>
                <div style="font-size: 0.9em; opacity: 0.9;">
                    🎯 Preneur: ${takerScore.toFixed(1)} pts | 🛡️ Défense: ${defenseScore.toFixed(1)} pts
                </div>
            `;
            winnerDiv.classList.remove('hidden');
        }
        
        updateGameHeader();
    });
    
    // Nouveau pli
    socket.on('newTrick', ({ currentPlayerIndex, currentTrick, lastTrickCards }) => {
        const winnerDiv = document.getElementById('trickWinner');
        if (winnerDiv) {
            winnerDiv.classList.add('hidden');
        }
        
        // Sauvegarder et afficher le dernier pli
        if (lastTrickCards && lastTrickCards.length > 0) {
            displayLastTrick(lastTrickCards);
        }
        
        // Masquer le chien à partir du 2ème pli
        if (currentTrick >= 2) {
            const dogDisplay = document.getElementById('dogDisplay');
            if (dogDisplay) {
                dogDisplay.classList.add('hidden');
            }
        }
        
        state.playedCards = [];
        state.gameState.trickCards = [];
        state.gameState.leadSuit = null;
        state.gameState.currentPlayerIndex = currentPlayerIndex;
        state.currentTrick = currentTrick;
        
        renderPlayedCards();
        updateGameHeader();
        renderOpponents();
    });
    
    // Partie terminée
    socket.on('gameFinished', ({ scores, takerScore, defenseScore, contract, takerName }) => {
        showMessage(`🎉 Partie terminée ! ${takerName} a fait ${takerScore.toFixed(1)} points`);
        
        setTimeout(() => {
            showScores(scores);
        }, 3000);
    });
}

function showGameScreen() {
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('biddingScreen').style.display = 'none';
    document.getElementById('dogScreen').style.display = 'none';
    document.getElementById('kingCallScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    
    // Ne PAS cacher le chien - il reste visible pendant toute la partie
    
    updateGameHeader();
    renderOpponents();
    renderPlayerHand();
}

export function playCard(index) {
    const card = state.myHand[index];
    
    // Vérification déjà faite dans card-utils canPlayCard
    
    // Envoyer la carte (pas l'index) pour éviter les problèmes de désynchronisation
    const socket = getSocket();
    socket.emit('playCard', {
        roomCode: state.roomCode,
        card: {
            suit: card.suit,
            value: card.value,
            isTrump: card.isTrump,
            isExcuse: card.isExcuse
        }
    });
}

function renderPlayedCards() {
    const center = document.getElementById('centerArea');
    if (!center || !state.playedCards) return;
    
    center.innerHTML = '';

    state.playedCards.forEach(({ card }) => {
        const cardDiv = createCardElement(card, true);
        cardDiv.style.width = '80px';
        cardDiv.style.height = '120px';
        center.appendChild(cardDiv);
    });
}

function displayLastTrick(trickCards) {
    if (!trickCards || trickCards.length === 0) return;
    
    state.lastTrickCards = trickCards;
    
    const lastTrickDisplay = document.getElementById('lastTrickDisplay');
    const lastTrickCardsContainer = document.getElementById('lastTrickCards');
    
    if (!lastTrickDisplay || !lastTrickCardsContainer) return;
    
    lastTrickCardsContainer.innerHTML = '';
    
    trickCards.forEach(({ card }) => {
        const cardDiv = createCardElement(card, false);
        cardDiv.style.width = '40px';
        cardDiv.style.height = '60px';
        cardDiv.style.fontSize = '0.6em';
        cardDiv.onclick = null;
        cardDiv.style.cursor = 'default';
        lastTrickCardsContainer.appendChild(cardDiv);
    });
    
    lastTrickDisplay.classList.remove('hidden');
}

export function renderOpponents() {
    const area = document.getElementById('playersArea');
    if (!area) return;
    
    area.innerHTML = '';

    const playerCount = state.players.length;
    const myIndex = state.players.findIndex(p => p.id === state.playerId);
    
    // Calculer les positions en cercle/polygone
    const positions = calculatePlayerPositions(playerCount, myIndex);
    
    state.players.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'opponent-player';
        
        // Le joueur connecté a un style différent
        if (player.id === state.playerId) {
            div.classList.add('current-player');
        }
        
        // Highlight du joueur dont c'est le tour
        if (state.gameState && index === state.gameState.currentPlayerIndex) {
            div.classList.add('current-turn');
        }
        
        // Position calculée
        const pos = positions[index];
        div.style.left = pos.x + '%';
        div.style.top = pos.y + '%';
        div.style.transform = 'translate(-50%, -50%)';
        
        let badge = '';
        if (player.id === state.playerId) {
            badge = '<div class="player-badge">👤 Vous</div>';
        }
        
        // Trouver la carte jouée par ce joueur dans le pli actuel
        let playedCardHTML = '';
        if (state.playedCards && state.playedCards.length > 0) {
            const playerCard = state.playedCards.find(pc => pc.playerIndex === index);
            if (playerCard) {
                const cardDiv = createCardElement(playerCard.card, false);
                cardDiv.style.width = '35px';
                cardDiv.style.height = '52px';
                cardDiv.style.fontSize = '0.5em';
                cardDiv.style.display = 'inline-block';
                cardDiv.style.marginTop = '5px';
                playedCardHTML = '<div style="margin-top: 5px;">' + cardDiv.outerHTML + '</div>';
            }
        }
        
        div.innerHTML = `
            <div class="player-name">${player.name}</div>
            ${badge}
            ${playedCardHTML}
        `;
        area.appendChild(div);
    });
}

function calculatePlayerPositions(playerCount, myIndex) {
    const positions = [];
    
    // Réorganiser pour que le joueur soit toujours en bas
    const orderedIndices = [];
    for (let i = 0; i < playerCount; i++) {
        orderedIndices.push((myIndex + i) % playerCount);
    }
    
    if (playerCount === 3) {
        // Triangle : moi en bas, 2 en haut
        const layout = {
            0: { x: 50, y: 85 },  // Moi en bas
            1: { x: 20, y: 20 },  // Gauche en haut
            2: { x: 80, y: 20 }   // Droite en haut
        };
        orderedIndices.forEach((originalIndex, layoutIndex) => {
            positions[originalIndex] = layout[layoutIndex];
        });
    } else if (playerCount === 4) {
        // Carré : moi en bas, 1 à gauche, 1 en haut, 1 à droite
        const layout = {
            0: { x: 50, y: 85 },  // Moi en bas
            1: { x: 10, y: 50 },  // Gauche
            2: { x: 50, y: 15 },  // Haut
            3: { x: 90, y: 50 }   // Droite
        };
        orderedIndices.forEach((originalIndex, layoutIndex) => {
            positions[originalIndex] = layout[layoutIndex];
        });
    } else if (playerCount === 5) {
        // Pentagone : moi en bas, 2 en haut-côtés, 2 au milieu-côtés
        const layout = {
            0: { x: 50, y: 85 },  // Moi en bas
            1: { x: 15, y: 60 },  // Gauche-bas
            2: { x: 20, y: 25 },  // Gauche-haut
            3: { x: 80, y: 25 },  // Droite-haut
            4: { x: 85, y: 60 }   // Droite-bas
        };
        orderedIndices.forEach((originalIndex, layoutIndex) => {
            positions[originalIndex] = layout[layoutIndex];
        });
    }
    
    return positions;
}

function showScores(scores) {
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('scoresScreen').style.display = 'block';

    const tbody = document.getElementById('scoresBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    // Séparer preneur/partenaire et défense
    const takerTeam = scores.filter(s => s.isTaker || s.isPartner);
    const defenseTeam = scores.filter(s => !s.isTaker && !s.isPartner);
    
    const hasTakerTeam = takerTeam.length > 0;
    const hasPartner = takerTeam.length > 1;

    // Afficher l'équipe du preneur
    if (hasTakerTeam) {
        const headerRow = document.createElement('tr');
        headerRow.style.background = '#e8f5e9';
        headerRow.innerHTML = `
            <td colspan="2" style="font-weight: bold; text-align: center; padding: 15px; color: #27ae60;">
                ${hasPartner ? '🤝 Équipe Preneur' : '👤 Preneur (seul)'}
            </td>
        `;
        tbody.appendChild(headerRow);

        takerTeam.forEach((s) => {
            const row = document.createElement('tr');
            const badge = s.isTaker ? '👑 Preneur' : '🤝 Partenaire';
            row.innerHTML = `
                <td style="padding-left: 30px;">${badge} - ${s.name}</td>
                <td style="font-weight: bold; color: ${s.score >= 0 ? '#27ae60' : '#e74c3c'};">${s.score > 0 ? '+' : ''}${s.score} points</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Afficher l'équipe de défense
    if (defenseTeam.length > 0) {
        const headerRow = document.createElement('tr');
        headerRow.style.background = '#ffebee';
        headerRow.innerHTML = `
            <td colspan="2" style="font-weight: bold; text-align: center; padding: 15px; color: #c62828;">
                🛡️ Défense (${defenseTeam.length} joueur${defenseTeam.length > 1 ? 's' : ''})
            </td>
        `;
        tbody.appendChild(headerRow);

        defenseTeam.forEach((s) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding-left: 30px;">${s.name}</td>
                <td style="font-weight: bold; color: ${s.score >= 0 ? '#27ae60' : '#e74c3c'};">${s.score > 0 ? '+' : ''}${s.score} points</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Ligne de séparation
    const separatorRow = document.createElement('tr');
    separatorRow.innerHTML = '<td colspan="2" style="height: 20px;"></td>';
    tbody.appendChild(separatorRow);

    // Afficher le résultat du contrat
    const takerTotalScore = takerTeam.reduce((sum, s) => sum + s.score, 0);
    const resultRow = document.createElement('tr');
    resultRow.style.background = takerTotalScore > 0 ? '#c8e6c9' : '#ffcdd2';
    resultRow.style.fontSize = '1.1em';
    resultRow.innerHTML = `
        <td colspan="2" style="text-align: center; padding: 15px; font-weight: bold;">
            ${takerTotalScore > 0 ? '✅ Contrat réussi !' : '❌ Contrat chuté'}
        </td>
    `;
    tbody.appendChild(resultRow);
}

// Exposer les fonctions globalement
window.playCard = playCard;
