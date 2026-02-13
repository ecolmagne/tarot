const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Stockage des parties en mémoire
const rooms = new Map();

// Générer un code de partie unique
function generateRoomCode() {
    let code;
    do {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (rooms.has(code));
    return code;
}

// Créer un deck de tarot
function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'C', 'D', 'R'];
    const trumps = Array.from({length: 21}, (_, i) => i + 1);
    
    let deck = [];

    // Cartes normales
    suits.forEach(suit => {
        values.forEach(value => {
            deck.push({
                suit: suit,
                value: value,
                isTrump: false,
                points: getCardPoints(value)
            });
        });
    });

    // Atouts
    trumps.forEach(num => {
        deck.push({
            suit: 'trump',
            value: num.toString(),
            isTrump: true,
            points: getTrumpPoints(num)
        });
    });

    // Excuse
    deck.push({
        suit: 'excuse',
        value: 'Excuse',
        isTrump: false,
        isExcuse: true,
        points: 4.5
    });

    return deck;
}

function getCardPoints(value) {
    const points = {
        'R': 4.5, 'D': 3.5, 'C': 2.5, 'V': 1.5
    };
    return points[value] || 0.5;
}

function getTrumpPoints(num) {
    if (num === 1 || num === 21) return 4.5;
    return 0.5;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealCards(deck, playerCount) {
    const cardsPerPlayer = playerCount === 3 ? 24 : (playerCount === 4 ? 18 : 15);
    const dogSize = playerCount === 5 ? 3 : 6; // 3 cartes pour 5 joueurs, 6 pour les autres
    
    const hands = [];
    for (let i = 0; i < playerCount; i++) {
        hands.push(deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer));
    }
    
    const dog = deck.slice(playerCount * cardsPerPlayer, playerCount * cardsPerPlayer + dogSize);
    
    return { hands, dog };
}

function sortHand(hand) {
    return hand.sort((a, b) => {
        if (a.isExcuse) return -1;
        if (b.isExcuse) return 1;
        if (a.isTrump && !b.isTrump) return 1;
        if (!a.isTrump && b.isTrump) return -1;
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        
        const aVal = isNaN(a.value) ? ({ 'V': 11, 'C': 12, 'D': 13, 'R': 14 }[a.value] || 0) : parseInt(a.value);
        const bVal = isNaN(b.value) ? ({ 'V': 11, 'C': 12, 'D': 13, 'R': 14 }[b.value] || 0) : parseInt(b.value);
        
        return aVal - bVal;
    });
}

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
    console.log('Nouveau client connecté:', socket.id);

    // Créer une nouvelle partie
    socket.on('createRoom', ({ playerName, playerCount }) => {
        const roomCode = generateRoomCode();
        
        const room = {
            code: roomCode,
            maxPlayers: playerCount,
            players: [{
                id: socket.id,
                name: playerName,
                isHost: true,
                hand: [],
                tricksWon: []
            }],
            started: false,
            gameState: null
        };
        
        rooms.set(roomCode, room);
        socket.join(roomCode);
        
        socket.emit('roomCreated', {
            roomCode: roomCode,
            playerId: socket.id,
            players: room.players,
            maxPlayers: room.maxPlayers
        });
        
        console.log(`Partie créée: ${roomCode} par ${playerName}`);
    });

    // Rejoindre une partie
    socket.on('joinRoom', ({ playerName, roomCode }) => {
        const room = rooms.get(roomCode);
        
        if (!room) {
            socket.emit('error', { message: 'Partie introuvable' });
            return;
        }
        
        if (room.started) {
            socket.emit('error', { message: 'La partie a déjà commencé' });
            return;
        }
        
        if (room.players.length >= room.maxPlayers) {
            socket.emit('error', { message: 'La partie est complète' });
            return;
        }
        
        room.players.push({
            id: socket.id,
            name: playerName,
            isHost: false,
            hand: [],
            tricksWon: []
        });
        
        socket.join(roomCode);
        
        socket.emit('roomJoined', {
            roomCode: roomCode,
            playerId: socket.id,
            players: room.players,
            maxPlayers: room.maxPlayers
        });
        
        // Informer tous les joueurs
        io.to(roomCode).emit('playerJoined', {
            players: room.players
        });
        
        console.log(`${playerName} a rejoint la partie ${roomCode}`);
    });

    // Démarrer la partie
    socket.on('startGame', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        
        if (!room) {
            socket.emit('error', { message: 'Partie introuvable' });
            return;
        }
        
        const host = room.players.find(p => p.isHost);
        if (host.id !== socket.id) {
            socket.emit('error', { message: 'Seul l\'hôte peut démarrer la partie' });
            return;
        }
        
        if (room.players.length !== room.maxPlayers) {
            socket.emit('error', { message: 'Attendez que tous les joueurs soient connectés' });
            return;
        }
        
        // Créer et distribuer les cartes
        const deck = createDeck();
        shuffleDeck(deck);
        const { hands, dog } = dealCards(deck, room.maxPlayers);
        
        // Assigner les mains aux joueurs
        room.players.forEach((player, index) => {
            player.hand = sortHand(hands[index]);
            player.tricksWon = [];
        });
        
        // Initialiser l'état du jeu
        room.gameState = {
            currentPlayerIndex: 0,
            currentTrick: 1,
            totalTricks: hands[0].length,
            trickCards: [],
            leadSuit: null,
            contract: null,
            takerIndex: null,
            dog: dog,
            phase: 'bidding', // bidding, playing, finished
            bids: [],
            takerScore: 0,
            defenseScore: 0,
            tricksCount: { taker: 0, defense: 0 }
        };
        
        room.started = true;
        
        // Envoyer à chaque joueur sa main
        room.players.forEach(player => {
            io.to(player.id).emit('gameStarted', {
                hand: player.hand,
                gameState: {
                    ...room.gameState,
                    dog: undefined // Ne pas révéler le chien
                },
                players: room.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    isHost: p.isHost
                }))
            });
        });
        
        // Démarrer immédiatement la phase d'enchères
        setTimeout(() => {
            io.to(roomCode).emit('biddingPhase', {
                currentPlayerIndex: 0
            });
        }, 2000);
        
        console.log(`Partie ${roomCode} démarrée`);
    });

    // Faire une enchère
    socket.on('makeBid', ({ roomCode, bid }) => {
        const room = rooms.get(roomCode);
        if (!room || !room.gameState) return;
        
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== room.gameState.currentPlayerIndex) return;
        
        // Valider que l'enchère est supérieure à la précédente (sauf si c'est "pass")
        if (bid !== 'pass') {
            const bidValues = { 'petite': 1, 'garde': 2, 'garde-sans': 3, 'garde-contre': 4 };
            let highestBidValue = 0;
            
            room.gameState.bids.forEach(b => {
                if (b.bid !== 'pass' && bidValues[b.bid] > highestBidValue) {
                    highestBidValue = bidValues[b.bid];
                }
            });
            
            // L'enchère doit être STRICTEMENT supérieure
            if (bidValues[bid] <= highestBidValue) {
                socket.emit('error', { message: 'Vous devez faire une enchère supérieure ou passer' });
                return;
            }
        }
        
        room.gameState.bids.push({
            playerIndex: playerIndex,
            bid: bid // 'pass', 'petite', 'garde', 'garde-sans', 'garde-contre'
        });
        
        // Si c'est une Garde contre, arrêter immédiatement les enchères
        if (bid === 'garde-contre') {
            room.gameState.takerIndex = playerIndex;
            room.gameState.contract = bid;
            
            io.to(roomCode).emit('biddingComplete', {
                takerIndex: playerIndex,
                takerName: room.players[playerIndex].name,
                contract: bid,
                dogCards: room.gameState.dog
            });

            // Le chien va au preneur
            room.gameState.dogToTaker = true;
            
            if (room.maxPlayers === 5) {
                // Envoyer à tous les joueurs
                room.players.forEach(player => {
                    io.to(player.id).emit('requestKingCall', {
                        isTaker: player.id === room.players[playerIndex].id
                    });
                });
            } else {
                room.gameState.phase = 'playing';
                room.gameState.currentPlayerIndex = playerIndex;
                io.to(roomCode).emit('startPlaying', {});
            }
            
            return; // Arrêter ici, ne pas continuer les enchères
        }
        
        // Passer au joueur suivant
        room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % room.players.length;
        
        // Envoyer l'enchère avec le prochain joueur
        io.to(roomCode).emit('bidMade', {
            playerIndex: playerIndex,
            bid: bid,
            nextPlayerIndex: room.gameState.currentPlayerIndex
        });
        
        // Vérifier si tous les joueurs ont enchéri
        if (room.gameState.bids.length === room.players.length) {
            // Déterminer le preneur
            const validBids = room.gameState.bids.filter(b => b.bid !== 'pass');
            
            if (validBids.length === 0) {
                // Tout le monde a passé, redistribuer
                io.to(roomCode).emit('allPassed', {});
                return;
            }
            
            // Trouver la meilleure enchère
            const bidValues = { 'petite': 1, 'garde': 2, 'garde-sans': 3, 'garde-contre': 4 };
            let bestBid = validBids[0];
            validBids.forEach(b => {
                if (bidValues[b.bid] > bidValues[bestBid.bid]) {
                    bestBid = b;
                }
            });
            
            room.gameState.takerIndex = bestBid.playerIndex;
            room.gameState.contract = bestBid.bid;
            
            io.to(roomCode).emit('biddingComplete', {
                takerIndex: bestBid.playerIndex,
                takerName: room.players[bestBid.playerIndex].name,
                contract: bestBid.bid,
                dogCards: room.gameState.dog // Le chien est visible par tous
            });

            // Gestion du chien selon le contrat
            if (bestBid.bid === 'petite' || bestBid.bid === 'garde') {
                // À 5 joueurs, appeler le Roi AVANT de voir le chien
                if (room.maxPlayers === 5) {
                    // Envoyer à tous les joueurs
                    room.players.forEach(player => {
                        io.to(player.id).emit('requestKingCall', {
                            isTaker: player.id === room.players[bestBid.playerIndex].id
                        });
                    });
                } else {
                    // Donner le chien au preneur (3 ou 4 joueurs)
                    // Ajouter le chien à la main du preneur côté serveur
                    room.players[bestBid.playerIndex].hand = room.players[bestBid.playerIndex].hand.concat(room.gameState.dog);
                    
                    io.to(room.players[bestBid.playerIndex].id).emit('receiveDog', {
                        dogCards: room.gameState.dog
                    });
                    
                    // Informer les autres joueurs
                    room.players.forEach((player, idx) => {
                        if (idx !== bestBid.playerIndex) {
                            io.to(player.id).emit('waitingForDog', {});
                        }
                    });
                }
            } else if (bestBid.bid === 'garde-sans') {
                // Le chien va à la défense
                room.gameState.dogToDefense = true;
                
                // Vérifier si c'est une partie à 5 joueurs
                if (room.maxPlayers === 5) {
                    // À 5 joueurs : appel de Roi AVANT de voir le chien
                    room.players.forEach(player => {
                        io.to(player.id).emit('requestKingCall', {
                            isTaker: player.id === room.players[bestBid.playerIndex].id
                        });
                    });
                } else {
                    room.gameState.phase = 'playing';
                    room.gameState.currentPlayerIndex = 0; // Le premier joueur commence
                    
                    // Envoyer à chaque joueur sa main
                    room.players.forEach((player, idx) => {
                        io.to(player.id).emit('startPlaying', {
                            hand: player.hand
                        });
                    });
                }
            } else if (bestBid.bid === 'garde-contre') {
                // Le chien va au preneur
                room.gameState.dogToTaker = true;
                
                if (room.maxPlayers === 5) {
                    // À 5 joueurs : appel de Roi AVANT de voir le chien
                    room.players.forEach(player => {
                        io.to(player.id).emit('requestKingCall', {
                            isTaker: player.id === room.players[bestBid.playerIndex].id
                        });
                    });
                } else {
                    room.gameState.phase = 'playing';
                    room.gameState.currentPlayerIndex = 0; // Le premier joueur commence
                    
                    // Envoyer à chaque joueur sa main
                    room.players.forEach((player, idx) => {
                        io.to(player.id).emit('startPlaying', {
                            hand: player.hand
                        });
                    });
                }
            }
        }
    });

    // Valider l'écart (le chien)
    socket.on('setDog', ({ roomCode, dogCards }) => {
        const room = rooms.get(roomCode);
        if (!room || !room.gameState) return;

        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== room.gameState.takerIndex) return;

        // Stocker l'écart
        room.gameState.discardedCards = dogCards;

        // Retirer les cartes écartées de la main du preneur
        const player = room.players[playerIndex];
        dogCards.forEach(dogCard => {
            const index = player.hand.findIndex(c => 
                c.suit === dogCard.suit && c.value === dogCard.value
            );
            if (index !== -1) {
                player.hand.splice(index, 1);
            }
        });

        // Renvoyer la main mise à jour au preneur
        io.to(socket.id).emit('dogSet', {
            updatedHand: player.hand
        });

        // À 5 joueurs, le Roi a déjà été appelé AVANT le chien
        // On commence directement à jouer
        room.gameState.phase = 'playing';
        room.gameState.currentPlayerIndex = 0; // Le premier joueur commence
        
        // Envoyer à chaque joueur sa main mise à jour
        room.players.forEach((player, idx) => {
            io.to(player.id).emit('startPlaying', {
                hand: player.hand
            });
        });
    });

    // Appeler un Roi (pour 5 joueurs)
    socket.on('callKing', ({ roomCode, suit }) => {
        const room = rooms.get(roomCode);
        if (!room || !room.gameState) return;

        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== room.gameState.takerIndex) return;

        const calledKing = `Roi de ${suit}`;
        room.gameState.calledKingSuit = suit;
        room.gameState.calledKing = calledKing;

        // Trouver qui a ce Roi
        room.players.forEach((player, idx) => {
            const hasKing = player.hand.some(c => c.value === 'R' && c.suit === suit);
            if (hasKing) {
                room.gameState.partnerIndex = idx;
                player.isPartner = true;
            }
        });

        // Annoncer le Roi appelé à tous
        io.to(roomCode).emit('kingCalled', {
            suit: suit,
            calledKing: calledKing
        });

        // Donner le chien au preneur après l'appel (pour Petite et Garde)
        if (room.gameState.contract === 'petite' || room.gameState.contract === 'garde') {
            setTimeout(() => {
                // Ajouter le chien à la main du preneur côté serveur
                room.players[playerIndex].hand = room.players[playerIndex].hand.concat(room.gameState.dog);
                
                io.to(room.players[playerIndex].id).emit('receiveDog', {
                    dogCards: room.gameState.dog
                });
                
                // Informer les autres joueurs
                room.players.forEach((player, idx) => {
                    if (idx !== playerIndex) {
                        io.to(player.id).emit('waitingForDog', {});
                    }
                });
            }, 2000);
        } else {
            // Pour Garde sans et Garde contre, commencer à jouer
            setTimeout(() => {
                room.gameState.phase = 'playing';
                room.gameState.currentPlayerIndex = 0; // Le premier joueur commence
                
                // Envoyer à chaque joueur sa main
                room.players.forEach((player, idx) => {
                    io.to(player.id).emit('startPlaying', {
                        hand: player.hand
                    });
                });
            }, 2000);
        }
    });

    // Jouer une carte
    socket.on('playCard', ({ roomCode, card: cardToPlay }) => {
        const room = rooms.get(roomCode);
        if (!room || !room.gameState || room.gameState.phase !== 'playing') return;
        
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        
        if (playerIndex !== room.gameState.currentPlayerIndex) {
            socket.emit('error', { message: 'Ce n\'est pas votre tour' });
            return;
        }
        
        const player = room.players[playerIndex];
        
        // Trouver la carte dans la main du joueur par suit et value
        const cardIndex = player.hand.findIndex(c => 
            c.suit === cardToPlay.suit && c.value === cardToPlay.value
        );
        
        if (cardIndex === -1) {
            socket.emit('error', { message: 'Carte invalide - vous ne possédez pas cette carte' });
            return;
        }
        
        const card = player.hand[cardIndex];
        
        // Vérifier si la carte peut être jouée
        if (!canPlayCard(card, player.hand, room.gameState)) {
            socket.emit('error', { message: 'Vous ne pouvez pas jouer cette carte' });
            return;
        }
        
        // Retirer la carte de la main du joueur
        player.hand.splice(cardIndex, 1);
        
        // Ajouter la carte au pli
        room.gameState.trickCards.push({
            card: card,
            playerIndex: playerIndex
        });
        
        // Définir la couleur demandée pour le premier joueur (sauf Excuse)
        if (room.gameState.trickCards.length === 1 && !card.isExcuse) {
            if (card.isTrump) {
                room.gameState.leadSuit = 'trump';
            } else {
                room.gameState.leadSuit = card.suit;
            }
        }
        
        io.to(roomCode).emit('cardPlayed', {
            playerIndex: playerIndex,
            card: card,
            trickCards: room.gameState.trickCards,
            remainingCards: player.hand.length
        });
        
        // Vérifier si le pli est complet
        if (room.gameState.trickCards.length === room.players.length) {
            // Déterminer le gagnant du pli
            const winnerIndex = determineTrickWinner(room.gameState.trickCards, room.gameState.leadSuit);
            
            // Gérer l'Excuse : elle reste à l'équipe qui l'a jouée
            let excusePlayerIndex = null;
            const excuseCard = room.gameState.trickCards.find((tc, idx) => {
                if (tc.card.isExcuse) {
                    excusePlayerIndex = tc.playerIndex;
                    return true;
                }
                return false;
            });
            
            // Calculer les points sans l'Excuse
            let trickPoints = calculateTrickPoints(room.gameState.trickCards);
            
            // L'Excuse est mise de côté et reste à son équipe
            if (excuseCard) {
                // Retirer les points de l'Excuse du pli
                trickPoints -= excuseCard.card.points;
                
                // L'Excuse va à l'équipe qui l'a jouée
                const excuseToTaker = (excusePlayerIndex === room.gameState.takerIndex || 
                                      (room.gameState.partnerIndex !== undefined && excusePlayerIndex === room.gameState.partnerIndex));
                
                if (excuseToTaker) {
                    room.gameState.takerScore += excuseCard.card.points;
                } else {
                    room.gameState.defenseScore += excuseCard.card.points;
                }
            }
            
            // Ajouter le pli au gagnant
            room.players[winnerIndex].tricksWon.push(room.gameState.trickCards);
            
            // Vérifier le petit au bout (1 d'atout au dernier pli)
            const isLastTrick = room.players[0].hand.length === 0;
            if (isLastTrick) {
                const hasPetit = room.gameState.trickCards.some(tc => 
                    tc.card.isTrump && tc.card.value === '1'
                );
                
                if (hasPetit) {
                    room.gameState.petitAuBout = true;
                    const isTakerWin = (winnerIndex === room.gameState.takerIndex || 
                                      (room.gameState.partnerIndex !== undefined && winnerIndex === room.gameState.partnerIndex));
                    room.gameState.petitAuBoutWinner = isTakerWin ? 'taker' : 'defense';
                }
            }
            
            // Mettre à jour les scores
            const isTakerTrick = (winnerIndex === room.gameState.takerIndex || 
                                 (room.gameState.partnerIndex !== undefined && winnerIndex === room.gameState.partnerIndex));
            if (isTakerTrick) {
                room.gameState.takerScore += trickPoints;
                room.gameState.tricksCount.taker++;
            } else {
                room.gameState.defenseScore += trickPoints;
                room.gameState.tricksCount.defense++;
            }
            
            io.to(roomCode).emit('trickComplete', {
                winnerIndex: winnerIndex,
                winnerName: room.players[winnerIndex].name,
                trickPoints: trickPoints,
                takerScore: room.gameState.takerScore,
                defenseScore: room.gameState.defenseScore
            });
            
            // Vérifier si la partie est terminée
            if (room.players[0].hand.length === 0) {
                const finalScores = calculateFinalScores(room);
                
                io.to(roomCode).emit('gameFinished', {
                    scores: finalScores,
                    takerScore: room.gameState.takerScore,
                    defenseScore: room.gameState.defenseScore,
                    contract: room.gameState.contract,
                    takerName: room.players[room.gameState.takerIndex].name,
                    petitAuBout: room.gameState.petitAuBout,
                    petitAuBoutWinner: room.gameState.petitAuBoutWinner
                });
                
                room.gameState.phase = 'finished';
            } else {
                // Sauvegarder le pli avant de le vider
                const lastTrick = [...room.gameState.trickCards];
                
                // Nouveau pli
                setTimeout(() => {
                    room.gameState.trickCards = [];
                    room.gameState.leadSuit = null;
                    room.gameState.currentPlayerIndex = winnerIndex;
                    room.gameState.currentTrick++;
                    
                    io.to(roomCode).emit('newTrick', {
                        currentPlayerIndex: winnerIndex,
                        currentTrick: room.gameState.currentTrick,
                        lastTrickCards: lastTrick
                    });
                }, 3000);
            }
        } else {
            // Passer au joueur suivant
            room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % room.players.length;
            
            io.to(roomCode).emit('nextPlayer', {
                currentPlayerIndex: room.gameState.currentPlayerIndex
            });
        }
    });

    // Démarrer une nouvelle partie
    socket.on('restartGame', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room) return;
        
        // Réinitialiser l'état du jeu
        room.started = false;
        room.gameState = null;
        
        // Réinitialiser les joueurs mais garder l'ordre et faire tourner le dealer
        room.players.forEach(player => {
            player.hand = [];
            player.tricksWon = [];
            player.isPartner = false;
        });
        
        // Faire tourner l'ordre des joueurs (le 2ème devient le 1er, etc.)
        const firstPlayer = room.players.shift();
        room.players.push(firstPlayer);
        
        // Informer tous les joueurs
        io.to(roomCode).emit('returnToLobby', {
            players: room.players
        });
        
        console.log(`Partie ${roomCode} prête à redémarrer`);
    });

    // Quitter une partie
    socket.on('leaveRoom', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room) return;
        
        room.players = room.players.filter(p => p.id !== socket.id);
        socket.leave(roomCode);
        
        if (room.players.length === 0) {
            rooms.delete(roomCode);
            console.log(`Partie ${roomCode} supprimée`);
        } else {
            // Si l'hôte quitte, promouvoir quelqu'un d'autre
            const hasHost = room.players.some(p => p.isHost);
            if (!hasHost && room.players.length > 0) {
                room.players[0].isHost = true;
            }
            
            io.to(roomCode).emit('playerLeft', {
                players: room.players
            });
        }
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log('Client déconnecté:', socket.id);
        
        // Trouver et nettoyer les parties
        rooms.forEach((room, roomCode) => {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                
                if (room.players.length === 0) {
                    rooms.delete(roomCode);
                } else {
                    const hasHost = room.players.some(p => p.isHost);
                    if (!hasHost) {
                        room.players[0].isHost = true;
                    }
                    
                    io.to(roomCode).emit('playerLeft', {
                        players: room.players
                    });
                }
            }
        });
    });
});

// Fonctions utilitaires pour les règles du jeu
function canPlayCard(card, hand, gameState) {
    // Règle spéciale : au premier pli UNIQUEMENT, on ne peut pas jouer la couleur du Roi appelé
    // sauf si c'est le Roi lui-même
    if (gameState.calledKingSuit && gameState.currentTrick === 1) {
        if (card.suit === gameState.calledKingSuit && 
            !(card.value === 'R' && card.suit === gameState.calledKingSuit)) {
            // C'est la couleur appelée mais pas le Roi
            // Vérifier si on a autre chose à jouer
            const hasOtherCards = hand.some(c => 
                c.suit !== gameState.calledKingSuit || 
                (c.value === 'R' && c.suit === gameState.calledKingSuit) ||
                c.isTrump ||
                c.isExcuse
            );
            if (hasOtherCards) {
                return false; // On ne peut pas jouer cette carte
            }
        }
    }
    // À partir du 2ème pli, on peut jouer normalement la couleur du Roi appelé
    
    // Premier joueur du pli
    if (gameState.trickCards.length === 0) {
        return true;
    }

    const leadSuit = gameState.leadSuit;
    
    // L'excuse peut toujours être jouée
    if (card.isExcuse) {
        return true;
    }

    // Si on demande un atout
    if (leadSuit === 'trump') {
        if (card.isTrump && !card.isExcuse) {
            // Obligation de monter : trouver le plus haut atout déjà joué
            let highestTrump = 0;
            gameState.trickCards.forEach(tc => {
                if (tc.card.isTrump && !tc.card.isExcuse) {
                    const trumpValue = parseInt(tc.card.value);
                    if (trumpValue > highestTrump) {
                        highestTrump = trumpValue;
                    }
                }
            });
            
            const myTrumpValue = parseInt(card.value);
            
            // Je dois monter si j'ai un atout plus haut
            if (myTrumpValue > highestTrump) {
                return true;
            } else {
                const hasHigherTrump = hand.some(c => 
                    c.isTrump && !c.isExcuse && parseInt(c.value) > highestTrump
                );
                return !hasHigherTrump;
            }
        }
        
        const hasTrump = hand.some(c => c.isTrump);
        return !hasTrump;
    }

    // Si on demande une couleur
    if (card.suit === leadSuit) {
        return true;
    }
    
    // Si on n'a pas la couleur demandée
    const hasSuit = hand.some(c => c.suit === leadSuit && !c.isExcuse);
    if (hasSuit) {
        return false;
    }

    // On doit couper avec un atout
    if (card.isTrump && !card.isExcuse) {
        // Si quelqu'un a déjà coupé, on doit surcouper si possible
        let highestTrump = 0;
        let someoneAlreadyCut = false;
        
        gameState.trickCards.forEach(tc => {
            if (tc.card.isTrump && !tc.card.isExcuse) {
                someoneAlreadyCut = true;
                const trumpValue = parseInt(tc.card.value);
                if (trumpValue > highestTrump) {
                    highestTrump = trumpValue;
                }
            }
        });
        
        if (someoneAlreadyCut) {
            const myTrumpValue = parseInt(card.value);
            
            if (myTrumpValue > highestTrump) {
                return true;
            } else {
                const hasHigherTrump = hand.some(c => 
                    c.isTrump && !c.isExcuse && parseInt(c.value) > highestTrump
                );
                return !hasHigherTrump;
            }
        }
        
        return true; // Première coupe
    }
    
    // On peut défausser si on n'a pas d'atout
    const hasTrump = hand.some(c => c.isTrump);
    return !hasTrump;
}

function determineTrickWinner(trickCards, leadSuit) {
    let winnerIndex = 0;
    let highestCard = trickCards[0];

    // L'excuse ne gagne jamais
    if (highestCard.card.isExcuse) {
        for (let i = 1; i < trickCards.length; i++) {
            if (!trickCards[i].card.isExcuse) {
                highestCard = trickCards[i];
                winnerIndex = i;
                break;
            }
        }
    }

    for (let i = 1; i < trickCards.length; i++) {
        const current = trickCards[i];
        
        // Ignorer l'excuse
        if (current.card.isExcuse) continue;
        if (highestCard.card.isExcuse) {
            highestCard = current;
            winnerIndex = i;
            continue;
        }

        // Atout bat toujours une couleur
        if (current.card.isTrump && !highestCard.card.isTrump) {
            highestCard = current;
            winnerIndex = i;
        }
        // Entre deux atouts, le plus haut gagne
        else if (current.card.isTrump && highestCard.card.isTrump) {
            if (parseInt(current.card.value) > parseInt(highestCard.card.value)) {
                highestCard = current;
                winnerIndex = i;
            }
        }
        // Entre deux cartes de la couleur demandée
        else if (!current.card.isTrump && !highestCard.card.isTrump && 
                 current.card.suit === leadSuit && highestCard.card.suit === leadSuit) {
            const currentVal = getCardValue(current.card.value);
            const highestVal = getCardValue(highestCard.card.value);
            if (currentVal > highestVal) {
                highestCard = current;
                winnerIndex = i;
            }
        }
    }

    return trickCards[winnerIndex].playerIndex;
}

function getCardValue(value) {
    const values = {
        '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'V': 11, 'C': 12, 'D': 13, 'R': 14
    };
    return values[value] || 0;
}

function calculateTrickPoints(trickCards) {
    let points = 0;
    trickCards.forEach(({ card }) => {
        points += card.points;
    });
    return points;
}

function calculateFinalScores(room) {
    const { gameState, players, maxPlayers } = room;
    
    // Points nécessaires selon le nombre de joueurs
    const requiredPoints = maxPlayers === 3 ? 36 : (maxPlayers === 4 ? 41 : 51);
    
    // Multiplicateur selon le contrat
    const multipliers = {
        'petite': 1,
        'garde': 2,
        'garde-sans': 4,
        'garde-contre': 6
    };
    
    const multiplier = multipliers[gameState.contract] || 1;
    
    // Ajuster les points du preneur selon le contrat
    let takerFinalPoints = gameState.takerScore;
    
    // Garde sans : le chien va à la défense
    if (gameState.dogToDefense) {
        const dogPoints = calculateTrickPoints(gameState.discardedCards ? 
            gameState.discardedCards.map(card => ({ card })) : 
            gameState.dog.map(card => ({ card }))
        );
        gameState.defenseScore += dogPoints;
    }
    
    // Garde contre : le chien va au preneur
    if (gameState.dogToTaker) {
        const dogPoints = calculateTrickPoints(gameState.dog.map(card => ({ card })));
        takerFinalPoints += dogPoints;
    }
    
    // Calcul du score de base
    const pointsDiff = takerFinalPoints - requiredPoints;
    const baseScore = 25 + Math.abs(pointsDiff);
    
    // Bonus pour le petit au bout
    let petitAuBoutBonus = 0;
    if (gameState.petitAuBout) {
        petitAuBoutBonus = 10;
        if (gameState.petitAuBoutWinner === 'taker') {
            // Bonus pour le preneur
        } else {
            // Bonus pour la défense (devient un malus pour le preneur)
            petitAuBoutBonus = -10;
        }
    }
    
    // Score final avec multiplicateur
    let finalScore = (baseScore + petitAuBoutBonus) * multiplier;
    
    const scores = players.map((player, index) => {
        let score = 0;
        
        const isTaker = index === gameState.takerIndex;
        const isPartner = maxPlayers === 5 && index === gameState.partnerIndex;
        
        if (maxPlayers === 5) {
            // Jeu à 5 avec partenaire
            if (isTaker || isPartner) {
                // Preneur et partenaire
                if (pointsDiff >= 0) {
                    // Contrat réussi
                    if (isTaker) {
                        score = finalScore * 2; // Le preneur gagne double
                    } else {
                        score = finalScore; // Le partenaire gagne simple
                    }
                } else {
                    // Contrat chuté
                    if (isTaker) {
                        score = -finalScore * 2;
                    } else {
                        score = -finalScore;
                    }
                }
            } else {
                // Défense (3 joueurs)
                if (pointsDiff >= 0) {
                    score = -finalScore;
                } else {
                    score = finalScore;
                }
            }
        } else {
            // Jeu à 3 ou 4
            if (isTaker) {
                // Le preneur
                if (pointsDiff >= 0) {
                    // Contrat réussi
                    score = finalScore * (maxPlayers - 1);
                } else {
                    // Contrat chuté
                    score = -finalScore * (maxPlayers - 1);
                }
            } else {
                // La défense
                if (pointsDiff >= 0) {
                    score = -finalScore;
                } else {
                    score = finalScore;
                }
            }
        }
        
        return {
            playerIndex: index,
            name: player.name,
            score: Math.round(score),
            isTaker: isTaker,
            isPartner: isPartner
        };
    });
    
    return scores;
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🃏 Serveur Tarot démarré sur le port ${PORT}`);
});
