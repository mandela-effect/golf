import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Card, PlayerHand } from '@/types/golf';
import { createDeck, calculateHandScore, checkFourOfAKind } from '@/utils/cardUtils';
import { toast } from 'sonner';

// WebSocket server URL - you'll need to replace this with your server URL
const WS_URL = 'ws://localhost:3001';

interface MultiplayerGameState extends Omit<GameState, 'currentTurn' | 'cpuHand' | 'playerHand'> {
  currentTurn: 'player1' | 'player2';
  player1Hand: PlayerHand;
  player2Hand: PlayerHand;
  playerId: 'player1' | 'player2';
  opponent: 'player1' | 'player2';
  connectedPlayers: number;
  roomCode: string;
}

interface WebSocketMessage {
  type: 'game-state' | 'player-joined' | 'player-left' | 'error' | 'room-full';
  data?: any;
  gameState?: MultiplayerGameState;
  message?: string;
}

const createInitialMultiplayerState = (playerId: 'player1' | 'player2', roomCode: string): MultiplayerGameState => {
  const deck = createDeck();
  return {
    player1Hand: {
      cards: [null, null, null, null],
      revealedCards: [false, false, false, false],
      peekedCards: [false, false, false, false]
    },
    player2Hand: {
      cards: [null, null, null, null],
      revealedCards: [false, false, false, false],
      peekedCards: [false, false, false, false]
    },
    deck,
    discardPile: [],
    currentTurn: 'player1',
    gamePhase: 'initial',
    roundScore: { player: 0, cpu: 0 },
    gameScore: { player: 0, cpu: 0 },
    peeksRemaining: 2,
    playerId,
    opponent: playerId === 'player1' ? 'player2' : 'player1',
    connectedPlayers: 1,
    roomCode
  };
};

export const useMultiplayerGame = (roomCode: string) => {
  const [gameState, setGameState] = useState<MultiplayerGameState | null>(null);
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}?room=${roomCode}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      toast.success('Connected to game room!');
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'game-state':
            if (message.gameState) {
              setGameState(message.gameState);
            }
            break;
          case 'player-joined':
            toast.success('Player joined the room!');
            break;
          case 'player-left':
            toast.info('Player left the room');
            break;
          case 'room-full':
            toast.error('Room is full!');
            break;
          case 'error':
            toast.error(message.message || 'An error occurred');
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      toast.error('Disconnected from game room');
    };

    ws.onerror = () => {
      setConnectionStatus('error');
      toast.error('Connection error');
    };

    return () => {
      ws.close();
    };
  }, [roomCode]);

  const dealInitialCards = useCallback(() => {
    sendMessage({
      type: 'deal-initial-cards'
    });
  }, [sendMessage]);

  const peekAtCard = useCallback((position: number) => {
    if (!gameState || gameState.gamePhase !== 'peek' || gameState.peeksRemaining <= 0) return;
    if (gameState.currentTurn !== gameState.playerId) return;
    
    const playerHand = gameState.playerId === 'player1' ? gameState.player1Hand : gameState.player2Hand;
    if (playerHand.peekedCards[position]) return;

    sendMessage({
      type: 'peek-card',
      position
    });
  }, [gameState, sendMessage]);

  const drawFromDeck = useCallback(() => {
    if (!gameState || gameState.gamePhase !== 'playing') return;
    if (gameState.currentTurn !== gameState.playerId) return;

    sendMessage({
      type: 'draw-from-deck'
    });
  }, [gameState, sendMessage]);

  const drawFromDiscard = useCallback(() => {
    if (!gameState || gameState.gamePhase !== 'playing') return;
    if (gameState.currentTurn !== gameState.playerId) return;

    sendMessage({
      type: 'draw-from-discard'
    });
  }, [gameState, sendMessage]);

  const replaceCard = useCallback((position: number) => {
    if (!gameState || !drawnCard || gameState.currentTurn !== gameState.playerId) return;
    if (gameState.gamePhase !== 'playing') return;
    
    const playerHand = gameState.playerId === 'player1' ? gameState.player1Hand : gameState.player2Hand;
    if (playerHand.revealedCards[position]) return;

    sendMessage({
      type: 'replace-card',
      position
    });
  }, [gameState, drawnCard, sendMessage]);

  const discardDrawnCard = useCallback(() => {
    if (!gameState || !drawnCard || gameState.gamePhase !== 'playing') return;

    sendMessage({
      type: 'discard-drawn-card'
    });
  }, [gameState, drawnCard, sendMessage]);

  const lockCardAfterDiscard = useCallback((position: number) => {
    if (!gameState || gameState.gamePhase !== 'flip-after-discard') return;
    if (gameState.currentTurn !== gameState.playerId) return;
    
    const playerHand = gameState.playerId === 'player1' ? gameState.player1Hand : gameState.player2Hand;
    if (playerHand.revealedCards[position]) return;

    sendMessage({
      type: 'lock-card-after-discard',
      position
    });
  }, [gameState, sendMessage]);

  const flipCardDirectly = useCallback((position: number) => {
    if (!gameState || gameState.currentTurn !== gameState.playerId) return;
    if (gameState.gamePhase !== 'playing') return;
    
    const playerHand = gameState.playerId === 'player1' ? gameState.player1Hand : gameState.player2Hand;
    if (playerHand.revealedCards[position]) return;

    sendMessage({
      type: 'flip-card-directly',
      position
    });
  }, [gameState, sendMessage]);

  const newRound = useCallback(() => {
    sendMessage({
      type: 'new-round'
    });
  }, [sendMessage]);

  // Handle drawn card from server updates
  useEffect(() => {
    if (gameState && gameState.gamePhase === 'playing') {
      // Check if we have a drawn card in the game state (server will include it)
      const serverDrawnCard = (gameState as any).drawnCard;
      if (serverDrawnCard && gameState.currentTurn === gameState.playerId) {
        setDrawnCard(serverDrawnCard);
      } else {
        setDrawnCard(null);
      }
    } else {
      setDrawnCard(null);
    }
  }, [gameState]);

  return {
    gameState,
    drawnCard,
    connectionStatus,
    dealInitialCards,
    peekAtCard,
    drawFromDeck,
    drawFromDiscard,
    replaceCard,
    discardDrawnCard,
    lockCardAfterDiscard,
    flipCardDirectly,
    newRound
  };
};