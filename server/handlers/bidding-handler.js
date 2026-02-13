// Gestion des enchères
const { getRoom } = require('../room-manager');
const { createDeck, shuffleDeck, dealCards, sortHand } = require('../deck-utils');

function handleBiddingEvents(io, socket) {
    
    socket.on('makeBid', ({ roomCode, bid }) => {
        const room = getRoom(roomCode);
        if (!room || !room.gameState) return;
        
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== room.gameState.currentPlayerIndex) {
            socket.emit('error', { message: 'Ce n\'est pas votre tour d\'enchérir' });
            return;
        }
        
        // Enregistrer l'enchère
        room.gameState.bids.push({ playerIndex, bid });
        
        const player = room.players[playerIndex];
        console.log(`💰 ${player.name} : ${bid}`);
        
        // Si Garde contre, arrêter les enchères immédiatement
        if (bid === 'garde-contre') {
            room.gameState.takerIndex = playerIndex;
            room.gameState.taker = player.name;
            room.gameState.contract = bid;
            
            // Annoncer la fin des enchères
            io.to(roomCode).emit('biddingComplete', {
                takerIndex: playerIndex,
                takerName: player.name,
                contract: bid,
                dogCards: room.gameState.dog
            });
            
            // Le chien va au preneur
            room.gameState.dogToTaker = true;
            
            if (room.maxPlayers === 5) {
                // À 5 joueurs : appel de Roi AVANT de voir le chien
                room.players.forEach(p => {
                    io.to(p.id).emit('requestKingCall', {
                        isTaker: p.id === player.id
                    });
                });
            } else {
                room.gameState.phase = 'playing';
                room.gameState.currentPlayerIndex = 0;
                
                // Envoyer à chaque joueur sa main
                room.players.forEach((p, idx) => {
                    io.to(p.id).emit('startPlaying', {
                        hand: p.hand
                    });
                });
            }
            return;
        }
        
        // Incrémenter currentPlayerIndex pour passer au joueur suivant
        room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % room.players.length;
        const nextPlayerIndex = room.gameState.currentPlayerIndex;
        
        // Envoyer l'enchère à tous
        io.to(roomCode).emit('bidMade', {
            playerIndex: playerIndex,
            bid: bid,
            nextPlayerIndex: nextPlayerIndex
        });
        
        // Vérifier si tous les joueurs ont enchéri
        if (room.gameState.bids.length === room.players.length) {
            // Déterminer le preneur
            const validBids = room.gameState.bids.filter(b => b.bid !== 'pass');
            
            if (validBids.length === 0) {
                io.to(roomCode).emit('allPassed', {});

                // Redistribuer après un délai
                setTimeout(() => {
                    // Le prochain premier enchérisseur est le suivant du précédent
                    const previousFirstBidder = room.gameState.firstBidderIndex || 0;
                    const newFirstBidder = (previousFirstBidder + 1) % room.players.length;

                    // Créer et mélanger un nouveau jeu
                    const deck = createDeck();
                    shuffleDeck(deck);
                    const { hands, dog } = dealCards(deck, room.maxPlayers);

                    // Réassigner les mains
                    room.players.forEach((player, index) => {
                        player.hand = sortHand(hands[index]);
                        player.tricksWon = [];
                    });

                    // Réinitialiser l'état du jeu
                    room.gameState = {
                        phase: 'bidding',
                        currentPlayerIndex: newFirstBidder,
                        firstBidderIndex: newFirstBidder,
                        currentTrick: 1,
                        dog: dog,
                        bids: [],
                        trickCards: [],
                        leadSuit: null,
                        takerScore: 0,
                        defenseScore: 0
                    };

                    // Envoyer les nouvelles cartes à chaque joueur
                    room.players.forEach((player, index) => {
                        io.to(player.id).emit('gameStarted', {
                            hand: player.hand,
                            gameState: {
                                phase: room.gameState.phase,
                                currentPlayerIndex: room.gameState.currentPlayerIndex,
                                currentTrick: room.gameState.currentTrick
                            },
                            players: room.players.map(p => ({
                                id: p.id,
                                name: p.name,
                                isHost: p.isHost
                            }))
                        });
                    });

                    // Démarrer la nouvelle phase d'enchères
                    io.to(roomCode).emit('biddingPhase', {
                        currentPlayerIndex: newFirstBidder
                    });

                    console.log(`🔄 Redistribution dans ${roomCode}, enchères à ${room.players[newFirstBidder].name}`);
                }, 3000);

                return;
            }
            
            // Trouver la plus haute enchère
            const bidValues = { 'petite': 1, 'garde': 2, 'garde-sans': 3, 'garde-contre': 4 };
            let bestBid = validBids[0];
            
            validBids.forEach(b => {
                if (bidValues[b.bid] > bidValues[bestBid.bid]) {
                    bestBid = b;
                }
            });
            
            room.gameState.takerIndex = bestBid.playerIndex;
            room.gameState.taker = room.players[bestBid.playerIndex].name;
            room.gameState.contract = bestBid.bid;
            
            // Annoncer la fin des enchères et afficher le chien
            io.to(roomCode).emit('biddingComplete', {
                takerIndex: bestBid.playerIndex,
                takerName: room.players[bestBid.playerIndex].name,
                contract: bestBid.bid,
                dogCards: room.gameState.dog
            });
            
            // Gestion du chien selon le contrat
            if (bestBid.bid === 'petite' || bestBid.bid === 'garde') {
                if (room.maxPlayers === 5) {
                    room.players.forEach(p => {
                        io.to(p.id).emit('requestKingCall', {
                            isTaker: p.id === room.players[bestBid.playerIndex].id
                        });
                    });
                } else {
                    // Ajouter le chien à la main du preneur
                    room.players[bestBid.playerIndex].hand = room.players[bestBid.playerIndex].hand.concat(room.gameState.dog);
                    
                    io.to(room.players[bestBid.playerIndex].id).emit('receiveDog', {
                        dogCards: room.gameState.dog
                    });
                    
                    room.players.forEach((p, idx) => {
                        if (idx !== bestBid.playerIndex) {
                            io.to(p.id).emit('waitingForDog', {});
                        }
                    });
                }
            } else if (bestBid.bid === 'garde-sans') {
                room.gameState.dogToDefense = true;
                
                if (room.maxPlayers === 5) {
                    room.players.forEach(p => {
                        io.to(p.id).emit('requestKingCall', {
                            isTaker: p.id === room.players[bestBid.playerIndex].id
                        });
                    });
                } else {
                    room.gameState.phase = 'playing';
                    room.gameState.currentPlayerIndex = 0;
                    
                    room.players.forEach((p, idx) => {
                        io.to(p.id).emit('startPlaying', {
                            hand: p.hand
                        });
                    });
                }
            }
        }
    });
}

module.exports = {
    handleBiddingEvents
};
