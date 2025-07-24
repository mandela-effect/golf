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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

  const peekAtCard = useCallback(async (position: number) => {
    if (gameState.gamePhase !== 'peek' || gameState.peeksRemaining <= 0) return;
    if (gameState.playerHand.peekedCards[position]) return; // Already peeked

    // Update state for the peeked card
    setGameState(prevState => {
      const newPlayerHand = { ...prevState.playerHand };
      newPlayerHand.peekedCards = [...newPlayerHand.peekedCards];
      newPlayerHand.peekedCards[position] = true;

      const newPeeksRemaining = prevState.peeksRemaining - 1;

      return {
        ...prevState,
        playerHand: newPlayerHand,
        peeksRemaining: newPeeksRemaining
      };
    });

    // Wait for the state update to complete and introduce a delay if this is the second peek
    if (gameState.peeksRemaining - 1 === 0) {
      await sleep(2000); // Add a 2-second delay
      setGameState(prevState => ({
        ...prevState,
        gamePhase: 'playing'
      }));
      toast.success("Peek phase complete! Game begins now!");
    } else {
      toast.info(`Peeked at card! ${gameState.peeksRemaining - 1} peek${gameState.peeksRemaining - 1 === 1 ? '' : 's'} remaining.`);
    }
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

  const lockCard = useCallback((position: number) => {
    if (gameState.currentTurn !== 'player' || gameState.gamePhase !== 'playing') return;
    if (gameState.playerHand.revealedCards[position]) return; // Card already locked

    setGameState(prevState => {
      const newPlayerHand = { ...prevState.playerHand };
      newPlayerHand.revealedCards = [...newPlayerHand.revealedCards];
      newPlayerHand.revealedCards[position] = true; // Lock the card

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
        playerHand: newPlayerHand,
        currentTurn: allPlayerCardsRevealed || allCpuCardsRevealed ? prevState.currentTurn : 'cpu',
        gamePhase: newGamePhase,
        roundScore: newRoundScore,
        gameScore: newGameScore
      };
    });

    toast.success("Card locked in!");
  }, [gameState.currentTurn, gameState.gamePhase, gameState.playerHand.revealedCards]);

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

    setGameState(prevState => {
      const newDiscardPile = [...prevState.discardPile, drawnCard];

      return {
        ...prevState,
        discardPile: newDiscardPile,
        drawnCard: null, // Clear the drawn card
        gamePhase: 'flip-after-discard', // Temporary phase to allow flipping a card
        currentTurn: 'player' // Ensure the player can still interact
      };
    });

    setDrawnCard(null);
    toast.info("Card discarded! Now flip one of your face-down cards.");
  }, [drawnCard, gameState.gamePhase]);

  const cpuTurn = useCallback(() => {
    setGameState(prevState => {
      if (prevState.currentTurn !== 'cpu' || prevState.deck.length === 0 || prevState.gamePhase !== 'playing') {
        return { ...prevState, currentTurn: 'player' };
      }

      const newDeck = [...prevState.deck];
      const drawnCard = newDeck.pop()!;

      const newDiscardPile = [...prevState.discardPile, drawnCard];
      const newCpuHand = { ...prevState.cpuHand };
      newCpuHand.revealedCards = [...newCpuHand.revealedCards];

      // Flip the first face-down card
      const flipIndex = newCpuHand.revealedCards.findIndex(revealed => !revealed);
      if (flipIndex !== -1) {
        newCpuHand.revealedCards[flipIndex] = true;
      }

      toast.info("CPU discarded a card and flipped one of its cards.");

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

  const lockCardAfterDiscard = useCallback((position: number) => {
    if (gameState.gamePhase !== 'flip-after-discard') return; // Ensure this only works in the correct phase
    if (gameState.playerHand.revealedCards[position]) return; // Card already locked

    setGameState(prevState => {
      const newPlayerHand = { ...prevState.playerHand };
      newPlayerHand.revealedCards = [...newPlayerHand.revealedCards];
      newPlayerHand.revealedCards[position] = true; // Lock the card

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

        // Check if game is finished
        if (newGameScore.player >= 100 || newGameScore.cpu >= 100) {
          newGamePhase = 'game-finished';
          const winner = newGameScore.player <= newGameScore.cpu ? 'Player' : 'CPU';
          toast.success(`Game Over! ${winner} wins with ${Math.min(newGameScore.player, newGameScore.cpu)} points!`);
        } else {
          toast.success(`Round finished! Player: ${playerScore}, CPU: ${cpuScore}`);
        }
      } else {
        newGamePhase = 'playing'; // Return to the normal playing phase
      }

      return {
        ...prevState,
        playerHand: newPlayerHand,
        currentTurn: allPlayerCardsRevealed || allCpuCardsRevealed ? prevState.currentTurn : 'cpu',
        gamePhase: newGamePhase,
        roundScore: newRoundScore,
        gameScore: newGameScore
      };
    });

    toast.success("Card locked in!");

    // Trigger CPU turn if the game is still in the playing phase
    if (gameState.gamePhase === 'flip-after-discard') {
      setTimeout(() => {
        cpuTurn();
      }, 1000);
    }
  }, [gameState.gamePhase, gameState.playerHand.revealedCards, cpuTurn]);

  const flipCardDirectly = useCallback((position: number) => {
    if (gameState.currentTurn !== 'player' || gameState.gamePhase !== 'playing') return;
    if (gameState.playerHand.revealedCards[position]) return; // Card already locked

    setGameState(prevState => {
      const newPlayerHand = { ...prevState.playerHand };
      newPlayerHand.revealedCards = [...newPlayerHand.revealedCards];
      newPlayerHand.revealedCards[position] = true; // Lock the card

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

        // Check if game is finished
        if (newGameScore.player >= 100 || newGameScore.cpu >= 100) {
          newGamePhase = 'game-finished';
          const winner = newGameScore.player <= newGameScore.cpu ? 'Player' : 'CPU';
          toast.success(`Game Over! ${winner} wins with ${Math.min(newGameScore.player, newGameScore.cpu)} points!`);
        } else {
          toast.success(`Round finished! Player: ${playerScore}, CPU: ${cpuScore}`);
        }
      } else {
        newGamePhase = 'playing'; // Return to the normal playing phase
      }

      return {
        ...prevState,
        playerHand: newPlayerHand,
        currentTurn: allPlayerCardsRevealed || allCpuCardsRevealed ? prevState.currentTurn : 'cpu',
        gamePhase: newGamePhase,
        roundScore: newRoundScore,
        gameScore: newGameScore
      };
    });

    toast.success("Card flipped!");
    setTimeout(() => {
      if (gameState.gamePhase === 'playing') {
        cpuTurn();
      }
    }, 1000);
  }, [gameState.currentTurn, gameState.gamePhase, gameState.playerHand.revealedCards, cpuTurn]);

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
    lockCard,
    replaceCard,
    discardDrawnCard,
    lockCardAfterDiscard,
    flipCardDirectly,
    newRound
  };
};
