import { Card, Suit, Rank } from '@/types/golf';

export const createDeck = (): Card[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const deck: Card[] = [];
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({
        suit,
        rank,
        id: `${suit}-${rank}`
      });
    });
  });
  
  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getCardValue = (rank: Rank): number => {
  switch (rank) {
    case 'A': return 11;
    case '2': return 0;
    case 'J': return 0;
    case 'Q': return 10;
    case 'K': return 10;
    default: return parseInt(rank);
  }
};

export const calculateHandScore = (cards: (Card | null)[]): number => {
  if (cards.some(card => card === null)) {
    return Infinity; // Invalid hand
  }
  
  const validCards = cards.filter(card => card !== null) as Card[];
  
  // Count occurrences of each rank
  const rankCounts: { [key: string]: number } = {};
  validCards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });
  
  let totalScore = 0;
  
  // Calculate score with pair cancellation
  Object.entries(rankCounts).forEach(([rank, count]) => {
    const value = getCardValue(rank as Rank);
    const remaining = count % 2;
    
    // Pairs cancel out (score 0), count remaining cards
    totalScore += remaining * value;
  });
  
  return totalScore;
};

export const getSuitSymbol = (suit: Suit): string => {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
  }
};

export const checkFourOfAKind = (cards: (Card | null)[]): boolean => {
  if (cards.some(card => card === null)) {
    return false; // Invalid hand
  }
  
  const validCards = cards.filter(card => card !== null) as Card[];
  
  return validCards.every(card => card.rank === validCards[0].rank);
}

export const getSuitColor = (suit: Suit): string => {
  return suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-black';
};