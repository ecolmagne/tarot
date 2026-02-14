// Logique principale du jeu
import { state } from './state.js';
import { getSocket } from './socket-handler.js';
import { showMessage, updateGameHeader, renderOpponents } from './ui-handler.js';
import { renderPlayerHand, createCardElement, sortHand, canPlayCard } from './card-utils.js';

export function initGame() {
    const socket = getSocket();

    // Une carte a été jouée
    socket.on('cardPlayed', ({ playerIndex, card, trickCards, remainingCards }) => {
        const player = state.players[playerIndex];

        if (player.id === state.playerId) {
            const cardIndex = state.myHand.findIndex(c =>
                c.suit === card.suit && c.value === card.value
            );
            if (cardIndex !== -1) {
                state.myHand.splice(cardIndex, 1);
            }
            renderPlayerHand();
        } else {
            player.cardCount = remainingCards;
            renderOpponents();
        }

        state.playedCards = trickCards;
        state.gameState.trickCards = trickCards;
        renderPlayedCards();
    });

    // Joueur suivant
    socket.on('nextPlayer', ({ currentPlayerIndex }) => {
        state.gameState.currentPlayerIndex = currentPlayerIndex;
        renderOpponents();

        const currentPlayer = state.players[currentPlayerIndex];
        if (currentPlayer.id === state.playerId) {
            showMessage('A vous de jouer !');
            renderPlayerHand();
        }
    });

    // Pli terminé
    socket.on('trickComplete', ({ winnerIndex, winnerName, trickPoints, takerScore, defenseScore }) => {
        state.gameState.takerScore = takerScore;
        state.gameState.defenseScore = defenseScore;

        const winnerDiv = document.getElementById('trickWinner');
        winnerDiv.innerHTML = `
            <div style="font-size: 1.1em; margin-bottom: 10px;">
                <strong>${winnerName}</strong> remporte le pli !
                <span style="color: #f39c12;">(+${trickPoints.toFixed(1)} pts)</span>
            </div>
            <div style="font-size: 0.9em; opacity: 0.9;">
                Preneur: ${takerScore.toFixed(1)} pts | Défense: ${defenseScore.toFixed(1)} pts
            </div>
        `;
        winnerDiv.classList.remove('hidden');

        updateGameHeader();
    });

    // Nouveau pli
    socket.on('newTrick', ({ currentPlayerIndex, currentTrick, lastTrickCards }) => {
        const winnerDiv = document.getElementById('trickWinner');
        winnerDiv.classList.add('hidden');

        if (lastTrickCards && lastTrickCards.length > 0) {
            displayLastTrick(lastTrickCards);
        }

        // Masquer le chien à partir du 2ème pli
        if (currentTrick >= 2) {
            const dogDisplay = document.getElementById('dogDisplay');
            if (dogDisplay) {
                dogDisplay.classList.add('hidden');
            }
            document.getElementById('debugSkipBtn').style.display = 'inline-block';
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
    socket.on('gameFinished', ({ scores, takerScore, defenseScore, contract, takerName, requiredPoints, takerBouts, multiplier, petitBonus, baseScore, difference }) => {
        showMessage(`Partie terminée ! ${takerName} a fait ${takerScore.toFixed(1)} points`);

        setTimeout(() => {
            showScores(scores, {
                takerScore, defenseScore, contract, takerName,
                requiredPoints, takerBouts, multiplier, petitBonus,
                baseScore, difference
            });
        }, 3000);
    });

    // Debug : sauter au dernier pli
    socket.on('skipToLastTrickDone', ({ hand, currentPlayerIndex, currentTrick, takerScore, defenseScore }) => {
        state.myHand = hand;
        state.playedCards = [];
        state.gameState.trickCards = [];
        state.gameState.leadSuit = null;
        state.gameState.currentPlayerIndex = currentPlayerIndex;
        state.currentTrick = currentTrick;

        document.getElementById('debugSkipBtn').style.display = 'none';
        document.getElementById('lastTrickDisplay').classList.add('hidden');

        renderPlayerHand();
        renderPlayedCards();
        renderOpponents();
        updateGameHeader();
        showMessage(`Sauté au pli ${currentTrick} | Preneur: ${takerScore.toFixed(1)} pts | Défense: ${defenseScore.toFixed(1)} pts`);
    });
}

function playCard(index) {
    const card = state.myHand[index];

    if (!canPlayCard(card)) {
        showMessage('Vous ne pouvez pas jouer cette carte');
        return;
    }

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
    if (!state.playedCards) return;

    const center = document.getElementById('centerArea');
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

function skipToLastTrick() {
    document.getElementById('debugSkipBtn').style.display = 'none';
    const socket = getSocket();
    socket.emit('skipToLastTrick', { roomCode: state.roomCode });
}

function showScores(scores, detail) {
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('scoresScreen').style.display = 'block';

    const tbody = document.getElementById('scoresBody');
    tbody.innerHTML = '';

    const contractLabels = {
        'petite': 'Petite',
        'garde': 'Garde',
        'garde-sans': 'Garde sans',
        'garde-contre': 'Garde contre'
    };

    // Détail du calcul
    if (detail) {
        const detailRow = document.createElement('tr');
        detailRow.style.background = '#e3f2fd';
        const detailCell = document.createElement('td');
        detailCell.colSpan = 2;
        detailCell.style.cssText = 'padding: 15px;';

        const contractLabel = contractLabels[detail.contract] || detail.contract;
        const success = detail.difference >= 0;
        const successIcon = success ? '\u2705' : '\u274C';
        const petitLine = detail.petitBonus !== 0
            ? `<tr><td>Petit au bout</td><td style="text-align:right;">${detail.petitBonus > 0 ? '+' : ''}${detail.petitBonus}</td></tr>`
            : '';

        const absDiff = Math.abs(detail.difference).toFixed(1);
        const signedTotal = success ? detail.baseScore * detail.multiplier : -(detail.baseScore * detail.multiplier);
        const petitPart = detail.petitBonus !== 0 ? ` ${detail.petitBonus > 0 ? '+' : '-'} ${Math.abs(detail.petitBonus)}` : '';
        const formulaSign = success ? '' : '-';
        const scoreColor = success ? '#27ae60' : '#e74c3c';

        detailCell.innerHTML = `
            <table style="width:100%; border-collapse:collapse; font-size:0.95em;">
                <tr style="border-bottom:1px solid #90caf9;">
                    <td style="padding:4px 0;"><strong>Annonce</strong></td>
                    <td style="text-align:right; padding:4px 0;"><strong>${contractLabel} (x${detail.multiplier})</strong></td>
                </tr>
                <tr>
                    <td style="padding:4px 0;">Points du preneur</td>
                    <td style="text-align:right;">${detail.takerScore.toFixed(1)}</td>
                </tr>
                <tr>
                    <td>Points de la défense</td>
                    <td style="text-align:right;">${detail.defenseScore.toFixed(1)}</td>
                </tr>
                <tr style="border-bottom:1px solid #90caf9;">
                    <td>Bouts du preneur</td>
                    <td style="text-align:right;">${detail.takerBouts} bout${detail.takerBouts > 1 ? 's' : ''} \u2192 contrat de ${detail.requiredPoints} pts</td>
                </tr>
                <tr>
                    <td>Différence</td>
                    <td style="text-align:right; color: ${detail.difference >= 0 ? '#27ae60' : '#e74c3c'};">${detail.difference >= 0 ? '+' : ''}${detail.difference.toFixed(1)} pts ${successIcon}</td>
                </tr>
                <tr>
                    <td>${success ? 'Bonus contrat' : 'Malus contrat'}</td>
                    <td style="text-align:right; color: ${scoreColor};">${success ? '+' : '-'}25</td>
                </tr>
                ${petitLine}
                <tr style="border-top:1px solid #90caf9; font-weight:bold;">
                    <td style="padding:6px 0;">Score du preneur</td>
                    <td style="text-align:right; color: ${scoreColor};">${formulaSign}(${absDiff} + 25${petitPart}) x ${detail.multiplier} = ${signedTotal > 0 ? '+' : ''}${signedTotal}</td>
                </tr>
            </table>
        `;
        detailRow.appendChild(detailCell);
        tbody.appendChild(detailRow);

        const sep = document.createElement('tr');
        sep.innerHTML = '<td colspan="2" style="height: 10px;"></td>';
        tbody.appendChild(sep);
    }

    // Trier par score décroissant
    scores.sort((a, b) => b.score - a.score);

    // Séparer preneur/partenaire et défense
    const takerTeam = scores.filter(s => s.isTaker || s.isPartner);
    const defenseTeam = scores.filter(s => !s.isTaker && !s.isPartner);

    const hasPartner = takerTeam.length > 1;

    // Afficher l'équipe du preneur
    if (takerTeam.length > 0) {
        const headerRow = document.createElement('tr');
        headerRow.style.background = '#e8f5e9';
        headerRow.innerHTML = `
            <td colspan="2" style="font-weight: bold; text-align: center; padding: 15px; color: #27ae60;">
                ${hasPartner ? '\u{1F91D} Équipe Preneur' : '\u{1F464} Preneur (seul)'}
            </td>
        `;
        tbody.appendChild(headerRow);

        takerTeam.forEach(s => {
            const row = document.createElement('tr');
            const badge = s.isTaker ? '\u{1F451} Preneur' : '\u{1F91D} Partenaire';
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
                \u{1F6E1}\uFE0F Défense (${defenseTeam.length} joueur${defenseTeam.length > 1 ? 's' : ''})
            </td>
        `;
        tbody.appendChild(headerRow);

        defenseTeam.forEach(s => {
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

    // Afficher le chien pour garde-sans et garde-contre
    const contract = state.gameState && state.gameState.contract;
    if ((contract === 'garde-sans' || contract === 'garde-contre') && state.dogCards && state.dogCards.length > 0) {
        const dogRow = document.createElement('tr');
        dogRow.style.background = '#fff3e0';
        const dogCell = document.createElement('td');
        dogCell.colSpan = 2;
        dogCell.style.cssText = 'text-align: center; padding: 15px;';
        dogCell.innerHTML = '<strong>\u{1F3B4} Le Chien :</strong><div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 10px;"></div>';
        const dogContainer = dogCell.querySelector('div');
        state.dogCards.forEach(card => {
            const cardDiv = createCardElement(card, false);
            cardDiv.style.width = '50px';
            cardDiv.style.height = '75px';
            cardDiv.style.cursor = 'default';
            dogContainer.appendChild(cardDiv);
        });
        dogRow.appendChild(dogCell);
        tbody.appendChild(dogRow);
    }

    // Afficher le résultat du contrat
    const takerTotalScore = takerTeam.reduce((sum, s) => sum + s.score, 0);
    const resultRow = document.createElement('tr');
    resultRow.style.background = takerTotalScore > 0 ? '#c8e6c9' : '#ffcdd2';
    resultRow.style.fontSize = '1.1em';
    resultRow.innerHTML = `
        <td colspan="2" style="text-align: center; padding: 15px; font-weight: bold;">
            ${takerTotalScore > 0 ? '\u2705 Contrat réussi !' : '\u274C Contrat chuté'}
        </td>
    `;
    tbody.appendChild(resultRow);
}

// Exposer globalement
window.playCard = playCard;
window.skipToLastTrick = skipToLastTrick;
