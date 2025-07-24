export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface PlayerHand {
  cards: (Card | null)[];
  revealedCards: boolean[];  // Cards that are face up and locked
  peekedCards: boolean[];    // Cards that have been peeked at (for initial peek phase)
}

export interface GameState {
  playerHand: PlayerHand;
  cpuHand: PlayerHand;
  deck: Card[];
  discardPile: Card[];
  currentTurn: 'player' | 'cpu';
  gamePhase: 'initial' | 'peek' | 'playing' | 'round-finished' | 'game-finished' | 'flip-after-discard';
  roundScore: { player: number; cpu: number };
  gameScore: { player: number; cpu: number };
  peeksRemaining: number;  // How many cards player can still peek at
}

export type GameAction = 
  | { type: 'DEAL_INITIAL_CARDS' }
  | { type: 'DRAW_FROM_DECK' }
  | { type: 'DRAW_FROM_DISCARD' }
  | { type: 'REPLACE_CARD'; position: number; newCard: Card }
  | { type: 'DISCARD_DRAWN_CARD'; card: Card }
  | { type: 'LOCK_CARD'; position: number }
  | { type: 'END_TURN' }
  | { type: 'NEW_ROUND' }
  | { type: 'RESET_GAME' };