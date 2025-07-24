import { useState, useCallback } from 'react';
import { GameState, Card } from '@/types/golf';
import { createDeck, calculateHandScore } from '@/utils/cardUtils';
import { toast } from 'sonner';

const createInitialState = (): GameState => {
  const deck = createDeck();
  return {
    playerHand: {
      cards: [null, null, null, null],
      revealedCards: [false, false, false, false],
      peekedCards: [false, false, false, false]
    },
    cpuHand: {
      cards: [null, null, null, null],
      revealedCards: [false, false, false, false],
      peekedCards: [false, false, false, false]
    },
    deck,
    discardPile: [],
    currentTurn: 'player',
    gamePhase: 'initial',
    roundScore: { player: 0, cpu: 0 },
    gameScore: { player: 0, cpu: 0 },
    peeksRemaining: 2
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
          revealedCards: [false, false, false, false],
          peekedCards: [false, false, false, false]
        },
        cpuHand: {
          cards: cpuCards,
          revealedCards: [false, false, false, false],
          peekedCards: [false, false, false, false]
        },
        deck: newDeck,
        discardPile,
        gamePhase: 'peek',
        peeksRemaining: 2
      };
    });
    toast.success("Cards dealt! Click 2 cards to peek at them, then the game will begin!");
  }, []);

  const peekAtCard = useCallback((position: number) => {
    if (gameState.gamePhase !== 'peek' || gameState.peeksRemaining <= 0) return;
    if (gameState.playerHand.peekedCards[position]) return; // Already peeked

    setGameState(prevState => {
      const newPlayerHand = { ...prevState.playerHand };
      newPlayerHand.peekedCards = [...newPlayerHand.peekedCards];
      newPlayerHand.peekedCards[position] = true;
      
      const newPeeksRemaining = prevState.peeksRemaining - 1;
      const newGamePhase = newPeeksRemaining === 0 ? 'playing' : 'peek';

      if (newPeeksRemaining === 0) {
        toast.success("Peek phase complete! Game begins now!");
      } else {
        toast.info(`Peeked at card! ${newPeeksRemaining} peek${newPeeksRemaining === 1 ? '' : 's'} remaining.`);
      }

      return {
        ...prevState,
        playerHand: newPlayerHand,
        peeksRemaining: newPeeksRemaining,
        gamePhase: newGamePhase
      };
    });
  }, [gameState.gamePhase, gameState.peeksRemaining, gameState.playerHand.peekedCards]);

  const drawFromDeck = useCallback(() => {
    if (gameState.deck.length === 0) {
      toast.error("Deck is empty!");
      return;
    }
    if (gameState.gamePhase !== 'playing') return;

    setGameState(prevState => {
      const newDeck = [...prevState.deck];
      const card = newDeck.pop()!;
      setDrawnCard(card);
      
      return {
        ...prevState,
        deck: newDeck
      };
    });
  }, [gameState.deck.length, gameState.gamePhase]);

  const drawFromDiscard = useCallback(() => {
    if (gameState.discardPile.length === 0) {
      toast.error("Discard pile is empty!");
      return;
    }
    if (gameState.gamePhase !== 'playing') return;

    setGameState(prevState => {
      const newDiscardPile = [...prevState.discardPile];
      const card = newDiscardPile.pop()!;
      setDrawnCard(card);
      
      return {
        ...prevState,
        discardPile: newDiscardPile
      };
    });
  }, [gameState.discardPile.length, gameState.gamePhase]);

  const replaceCard = useCallback((position: number) => {
    if (!drawnCard || gameState.currentTurn !== 'player' || gameState.gamePhase !== 'playing') return;
    if (gameState.playerHand.revealedCards[position]) return; // Card already locked

    setGameState(prevState => {
      const newPlayerHand = { ...prevState.playerHand };
      const oldCard = newPlayerHand.cards[position];
      
      newPlayerHand.cards = [...newPlayerHand.cards];
      newPlayerHand.revealedCards = [...newPlayerHand.revealedCards];
      newPlayerHand.cards[position] = drawnCard;
      newPlayerHand.revealedCards[position] = true; // Lock the card when revealed
      
      const newDiscardPile = oldCard ? [...prevState.discardPile, oldCard] : prevState.discardPile;

      // Check if round is finished (all player cards revealed)
      const allPlayerCardsRevealed = newPlayerHand.revealedCards.every(revealed => revealed);
      const allCpuCardsRevealed = prevState.cpuHand.revealedCards.every(revealed => revealed);
      
      let newGamePhase: GameState['gamePhase'] = prevState.gamePhase;
      let newRoundScore = prevState.roundScore;
      let newGameScore = prevState.gameScore;

      if (allPlayerCardsRevealed || allCpuCardsRevealed) {
        newGamePhase = 'round-finished';
        const playerScore = calculateHandScore(newPlayerHand.cards);
        const cpuScore = calculateHandScore(prevState.cpuHand.cards);
        
        newRoundScore = { player: playerScore, cpu: cpuScore };
        newGameScore = {
          player: prevState.gameScore.player + playerScore,
          cpu: prevState.gameScore.cpu + cpuScore
        };

        // Check if game is finished (someone reached 100+ points)
        if (newGameScore.player >= 100 || newGameScore.cpu >= 100) {
          newGamePhase = 'game-finished';
          const winner = newGameScore.player <= newGameScore.cpu ? 'Player' : 'CPU';
          toast.success(`Game Over! ${winner} wins with ${Math.min(newGameScore.player, newGameScore.cpu)} points!`);
        } else {
          toast.success(`Round finished! Player: ${playerScore}, CPU: ${cpuScore}`);
        }
      }

      return {
        ...prevState,
        playerHand: newPlayerHand,
        discardPile: newDiscardPile,
        currentTurn: allPlayerCardsRevealed || allCpuCardsRevealed ? prevState.currentTurn : 'cpu',
        gamePhase: newGamePhase,
        roundScore: newRoundScore,
        gameScore: newGameScore
      };
    });

    setDrawnCard(null);
    toast.success("Card replaced and locked!");
    
    // CPU turn after a short delay if round not finished
    if (gameState.gamePhase === 'playing') {
      setTimeout(() => {
        cpuTurn();
      }, 1000);
    }
  }, [drawnCard, gameState.currentTurn, gameState.gamePhase, gameState.playerHand.revealedCards]);

  const discardDrawnCard = useCallback(() => {
    if (!drawnCard || gameState.gamePhase !== 'playing') return;

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
  }, [drawnCard, gameState.gamePhase]);

  const cpuTurn = useCallback(() => {
    setGameState(prevState => {
      if (prevState.currentTurn !== 'cpu' || prevState.deck.length === 0 || prevState.gamePhase !== 'playing') {
        return { ...prevState, currentTurn: 'player' };
      }

      const newDeck = [...prevState.deck];
      const drawnCard = newDeck.pop()!;
      
      // Simple CPU AI: Replace highest value card if drawn card is better
      const cpuCards = [...prevState.cpuHand.cards] as Card[];
      let bestPosition = -1;
      let highestValue = -1;

      cpuCards.forEach((card, index) => {
        if (!prevState.cpuHand.revealedCards[index] && card) {
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
        // Replace the highest value card and lock it
        const oldCard = newCpuHand.cards[bestPosition];
        newCpuHand.cards = [...newCpuHand.cards];
        newCpuHand.revealedCards = [...newCpuHand.revealedCards];
        newCpuHand.cards[bestPosition] = drawnCard;
        newCpuHand.revealedCards[bestPosition] = true; // Lock the card
        if (oldCard) newDiscardPile.push(oldCard);
        toast.info("CPU replaced and locked a card");
      } else {
        // Discard the drawn card
        newDiscardPile.push(drawnCard);
        toast.info("CPU discarded the drawn card");
      }

      // Check if round is finished
      const allPlayerCardsRevealed = prevState.playerHand.revealedCards.every(revealed => revealed);
      const allCpuCardsRevealed = newCpuHand.revealedCards.every(revealed => revealed);
      
      let newGamePhase: GameState['gamePhase'] = prevState.gamePhase;
      let newRoundScore = prevState.roundScore;
      let newGameScore = prevState.gameScore;

      if (allPlayerCardsRevealed || allCpuCardsRevealed) {
        newGamePhase = 'round-finished';
        const playerScore = calculateHandScore(prevState.playerHand.cards);
        const cpuScore = calculateHandScore(newCpuHand.cards);
        
        newRoundScore = { player: playerScore, cpu: cpuScore };
        newGameScore = {
          player: prevState.gameScore.player + playerScore,
          cpu: prevState.gameScore.cpu + cpuScore
        };

        // Check if game is finished
        if (newGameScore.player >= 100 || newGameScore.cpu >= 100) {
          newGamePhase = 'game-finished';
          const winner = newGameScore.player <= newGameScore.cpu ? 'Player' : 'CPU';
          toast.success(`Game Over! ${winner} wins with ${Math.min(newGameScore.player, newGameScore.cpu)} points!`);
        } else {
          toast.success(`Round finished! Player: ${playerScore}, CPU: ${cpuScore}`);
        }
      }

      return {
        ...prevState,
        cpuHand: newCpuHand,
        deck: newDeck,
        discardPile: newDiscardPile,
        currentTurn: allPlayerCardsRevealed || allCpuCardsRevealed ? prevState.currentTurn : 'player',
        gamePhase: newGamePhase,
        roundScore: newRoundScore,
        gameScore: newGameScore
      };
    });
  }, []);

  const newRound = useCallback(() => {
    if (gameState.gamePhase === 'game-finished') {
      // Reset entire game
      const newState = createInitialState();
      setGameState(newState);
      setDrawnCard(null);
      setTimeout(() => dealInitialCards(), 100);
    } else {
      // Start new round keeping game score
      setGameState(prevState => {
        const deck = createDeck();
        return {
          ...prevState,
          playerHand: {
            cards: [null, null, null, null],
            revealedCards: [false, false, false, false],
            peekedCards: [false, false, false, false]
          },
          cpuHand: {
            cards: [null, null, null, null],
            revealedCards: [false, false, false, false],
            peekedCards: [false, false, false, false]
          },
          deck,
          discardPile: [],
          currentTurn: 'player',
          gamePhase: 'initial',
          roundScore: { player: 0, cpu: 0 },
          peeksRemaining: 2
        };
      });
      setDrawnCard(null);
      setTimeout(() => dealInitialCards(), 100);
    }
  }, [dealInitialCards, gameState.gamePhase]);

  return {
    gameState,
    drawnCard,
    dealInitialCards,
    peekAtCard,
    drawFromDeck,
    drawFromDiscard,
    replaceCard,
    discardDrawnCard,
    newRound
  };
};
