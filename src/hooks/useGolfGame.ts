import { useState, useCallback } from 'react';
import { GameState, Card } from '@/types/golf';
import { createDeck, calculateHandScore } from '@/utils/cardUtils';
import { toast } from 'sonner';

const createInitialState = (): GameState => {
  const deck = createDeck();
  return {
    playerHand: {
      cards: [null, null, null, null],
      lockedCards: [false, false, false, false]
    },
    cpuHand: {
      cards: [null, null, null, null],
      lockedCards: [false, false, false, false]
    },
    deck,
    discardPile: [],
    currentTurn: 'player',
    gamePhase: 'initial',
    roundScore: { player: 0, cpu: 0 },
    gameScore: { player: 0, cpu: 0 }
  };
};

export const useGolfGame = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);

  const dealInitialCards = useCallback(() => {
    setGameState(prevState => {
      const newDeck = [...prevState.deck];
      const playerCards: Card[] = [];
      const cpuCards: Card[] = [];

      // Deal 4 cards to each player
      for (let i = 0; i < 4; i++) {
        playerCards.push(newDeck.pop()!);
        cpuCards.push(newDeck.pop()!);
      }

      // Add first card to discard pile
      const discardPile = [newDeck.pop()!];

      return {
        ...prevState,
        playerHand: {
          cards: playerCards,
          lockedCards: [false, false, false, false]
        },
        cpuHand: {
          cards: cpuCards,
          lockedCards: [false, false, false, false]
        },
        deck: newDeck,
        discardPile,
        gamePhase: 'playing'
      };
    });
    toast.success("Cards dealt! Game started!");
  }, []);

  const drawFromDeck = useCallback(() => {
    if (gameState.deck.length === 0) {
      toast.error("Deck is empty!");
      return;
    }

    setGameState(prevState => {
      const newDeck = [...prevState.deck];
      const card = newDeck.pop()!;
      setDrawnCard(card);
      
      return {
        ...prevState,
        deck: newDeck
      };
    });
  }, [gameState.deck.length]);

  const drawFromDiscard = useCallback(() => {
    if (gameState.discardPile.length === 0) {
      toast.error("Discard pile is empty!");
      return;
    }

    setGameState(prevState => {
      const newDiscardPile = [...prevState.discardPile];
      const card = newDiscardPile.pop()!;
      setDrawnCard(card);
      
      return {
        ...prevState,
        discardPile: newDiscardPile
      };
    });
  }, [gameState.discardPile.length]);

  const replaceCard = useCallback((position: number) => {
    if (!drawnCard || gameState.currentTurn !== 'player') return;

    setGameState(prevState => {
      const newPlayerHand = { ...prevState.playerHand };
      const oldCard = newPlayerHand.cards[position];
      
      newPlayerHand.cards = [...newPlayerHand.cards];
      newPlayerHand.cards[position] = drawnCard;
      
      const newDiscardPile = oldCard ? [...prevState.discardPile, oldCard] : prevState.discardPile;

      return {
        ...prevState,
        playerHand: newPlayerHand,
        discardPile: newDiscardPile,
        currentTurn: 'cpu'
      };
    });

    setDrawnCard(null);
    toast.success("Card replaced!");
    
    // CPU turn after a short delay
    setTimeout(() => {
      cpuTurn();
    }, 1000);
  }, [drawnCard, gameState.currentTurn]);

  const discardDrawnCard = useCallback(() => {
    if (!drawnCard) return;

    setGameState(prevState => ({
      ...prevState,
      discardPile: [...prevState.discardPile, drawnCard],
      currentTurn: 'cpu'
    }));

    setDrawnCard(null);
    toast.info("Card discarded!");
    
    // CPU turn after a short delay
    setTimeout(() => {
      cpuTurn();
    }, 1000);
  }, [drawnCard]);

  const cpuTurn = useCallback(() => {
    setGameState(prevState => {
      if (prevState.currentTurn !== 'cpu' || prevState.deck.length === 0) {
        return { ...prevState, currentTurn: 'player' };
      }

      const newDeck = [...prevState.deck];
      const drawnCard = newDeck.pop()!;
      
      // Simple CPU AI: Replace highest value card if drawn card is better
      const cpuCards = [...prevState.cpuHand.cards] as Card[];
      let bestPosition = -1;
      let highestValue = -1;

      cpuCards.forEach((card, index) => {
        if (!prevState.cpuHand.lockedCards[index] && card) {
          const cardValue = calculateHandScore([card]);
          if (cardValue > highestValue) {
            highestValue = cardValue;
            bestPosition = index;
          }
        }
      });

      const drawnCardValue = calculateHandScore([drawnCard]);
      
      let newCpuHand = { ...prevState.cpuHand };
      let newDiscardPile = [...prevState.discardPile];

      if (bestPosition !== -1 && drawnCardValue < highestValue) {
        // Replace the highest value card
        const oldCard = newCpuHand.cards[bestPosition];
        newCpuHand.cards = [...newCpuHand.cards];
        newCpuHand.cards[bestPosition] = drawnCard;
        if (oldCard) newDiscardPile.push(oldCard);
        toast.info("CPU replaced a card");
      } else {
        // Discard the drawn card
        newDiscardPile.push(drawnCard);
        toast.info("CPU discarded the drawn card");
      }

      return {
        ...prevState,
        cpuHand: newCpuHand,
        deck: newDeck,
        discardPile: newDiscardPile,
        currentTurn: 'player'
      };
    });
  }, []);

  const newRound = useCallback(() => {
    const newState = createInitialState();
    setGameState(newState);
    setDrawnCard(null);
    dealInitialCards();
  }, [dealInitialCards]);

  return {
    gameState,
    drawnCard,
    dealInitialCards,
    drawFromDeck,
    drawFromDiscard,
    replaceCard,
    discardDrawnCard,
    newRound
  };
};