// Utilitaires pour le jeu de cartes

// Créer un jeu de 78 cartes
function createDeck() {
    const deck = [];
    
    // Les 4 couleurs
    const suits = ['♠', '♥', '♣', '♦'];
    
    // Cartes numérotées (1-10) + figures (V, C, D, R)
    suits.forEach(suit => {
        for (let i = 1; i <= 10; i++) {
            deck.push({
                suit: suit,
                value: i.toString(),
                isTrump: false,
                isExcuse: false,
                points: getCardPoints(i.toString(), false, false)
            });
        }
        
        // Figures
        ['V', 'C', 'D', 'R'].forEach(figure => {
            deck.push({
                suit: suit,
                value: figure,
                isTrump: false,
                isExcuse: false,
                points: getCardPoints(figure, false, false)
            });
        });
    });
    
    // 21 atouts
    for (let i = 1; i <= 21; i++) {
        deck.push({
            suit: 'trump',
            value: i.toString(),
            isTrump: true,
            isExcuse: false,
            points: getCardPoints(i.toString(), true, false)
        });
    }
    
    // L'Excuse
    deck.push({
        suit: 'excuse',
        value: '0',
        isTrump: false,
        isExcuse: true,
        points: 4.5
    });
    
    return deck;
}

// Calculer les points d'une carte
function getCardPoints(value, isTrump, isExcuse) {
    if (isExcuse) return 4.5;
    
    // Bouts (1, 21, Excuse)
    if (isTrump && (value === '1' || value === '21')) return 4.5;
    
    // Figures
    if (value === 'R') return 4.5;
    if (value === 'D') return 3.5;
    if (value === 'C') return 2.5;
    if (value === 'V') return 1.5;
    
    // Autres cartes
    return 0.5;
}

// Mélanger le jeu
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Distribuer les cartes
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

// Trier une main
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

// Calculer les points d'un pli
function calculateTrickPoints(trickCards) {
    let total = 0;
    trickCards.forEach(tc => {
        total += tc.card.points;
    });
    // Arrondir à 0.5 près
    return Math.round(total * 2) / 2;
}

module.exports = {
    createDeck,
    getCardPoints,
    shuffleDeck,
    dealCards,
    sortHand,
    calculateTrickPoints
};
