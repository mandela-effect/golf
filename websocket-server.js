const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// Game state utilities
const createDeck = () => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        id: `${suit}-${rank}-${Math.random().toString(36).substring(2)}`
      });
    }
  }
  
  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
};

const createInitialGameState = (roomCode) => {
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
    roomCode,
    connectedPlayers: 0
  };
};

// In-memory game rooms
const gameRooms = new Map();

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, request) => {
  const query = url.parse(request.url, true).query;
  const roomCode = query.room;
  
  if (!roomCode) {
    ws.close(1008, 'Room code required');
    return;
  }

  console.log(`Player joining room: ${roomCode}`);

  // Get or create room
  if (!gameRooms.has(roomCode)) {
    gameRooms.set(roomCode, {
      gameState: createInitialGameState(roomCode),
      players: new Map(),
      playerCount: 0
    });
  }

  const room = gameRooms.get(roomCode);

  // Check if room is full
  if (room.playerCount >= 2) {
    ws.send(JSON.stringify({ type: 'room-full' }));
    ws.close();
    return;
  }

  // Assign player ID
  const playerId = room.playerCount === 0 ? 'player1' : 'player2';
  const opponentId = playerId === 'player1' ? 'player2' : 'player1';
  
  room.players.set(playerId, ws);
  room.playerCount++;
  room.gameState.connectedPlayers = room.playerCount;

  // Send initial game state to new player
  const playerGameState = {
    ...room.gameState,
    playerId,
    opponent: opponentId
  };
  
  ws.send(JSON.stringify({
    type: 'game-state',
    gameState: playerGameState
  }));

  // Notify other players
  room.players.forEach((playerWs, otherPlayerId) => {
    if (otherPlayerId !== playerId && playerWs.readyState === WebSocket.OPEN) {
      playerWs.send(JSON.stringify({ type: 'player-joined' }));
      // Send updated game state with connection count
      const otherPlayerGameState = {
        ...room.gameState,
        playerId: otherPlayerId,
        opponent: otherPlayerId === 'player1' ? 'player2' : 'player1'
      };
      playerWs.send(JSON.stringify({
        type: 'game-state',
        gameState: otherPlayerGameState
      }));
    }
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleGameAction(room, playerId, data);
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log(`Player ${playerId} left room ${roomCode}`);
    room.players.delete(playerId);
    room.playerCount--;
    room.gameState.connectedPlayers = room.playerCount;

    if (room.playerCount === 0) {
      gameRooms.delete(roomCode);
    } else {
      // Notify remaining players
      room.players.forEach((playerWs, otherPlayerId) => {
        if (playerWs.readyState === WebSocket.OPEN) {
          playerWs.send(JSON.stringify({ type: 'player-left' }));
          const otherPlayerGameState = {
            ...room.gameState,
            playerId: otherPlayerId,
            opponent: otherPlayerId === 'player1' ? 'player2' : 'player1'
          };
          playerWs.send(JSON.stringify({
            type: 'game-state',
            gameState: otherPlayerGameState
          }));
        }
      });
    }
  });
});

const broadcastGameState = (room) => {
  room.players.forEach((ws, playerId) => {
    if (ws.readyState === WebSocket.OPEN) {
      const playerGameState = {
        ...room.gameState,
        playerId,
        opponent: playerId === 'player1' ? 'player2' : 'player1'
      };
      
      ws.send(JSON.stringify({
        type: 'game-state',
        gameState: playerGameState
      }));
    }
  });
};

const handleGameAction = (room, playerId, action) => {
  const gameState = room.gameState;

  switch (action.type) {
    case 'deal-initial-cards':
      if (gameState.gamePhase === 'initial' && gameState.connectedPlayers === 2) {
        // Deal 4 cards to each player
        const playerCards = [];
        const player2Cards = [];
        
        for (let i = 0; i < 4; i++) {
          playerCards.push(gameState.deck.pop());
          player2Cards.push(gameState.deck.pop());
        }
        
        gameState.player1Hand.cards = playerCards;
        gameState.player2Hand.cards = player2Cards;
        gameState.discardPile = [gameState.deck.pop()];
        gameState.gamePhase = 'peek';
        gameState.peeksRemaining = 2;
      }
      break;

    case 'peek-card':
      if (gameState.gamePhase === 'peek' && gameState.currentTurn === playerId && gameState.peeksRemaining > 0) {
        const playerHand = gameState[`${playerId}Hand`];
        if (!playerHand.peekedCards[action.position]) {
          playerHand.peekedCards[action.position] = true;
          gameState.peeksRemaining--;
          
          if (gameState.peeksRemaining === 0) {
            // Switch to other player's peek phase or start playing
            if (playerId === 'player1' && !gameState.player2Hand.peekedCards.some(p => p)) {
              gameState.currentTurn = 'player2';
              gameState.peeksRemaining = 2;
            } else {
              gameState.gamePhase = 'playing';
              gameState.currentTurn = 'player1';
            }
          }
        }
      }
      break;

    case 'draw-from-deck':
      if (gameState.gamePhase === 'playing' && gameState.currentTurn === playerId && gameState.deck.length > 0) {
        gameState.drawnCard = gameState.deck.pop();
      }
      break;

    case 'draw-from-discard':
      if (gameState.gamePhase === 'playing' && gameState.currentTurn === playerId && gameState.discardPile.length > 0) {
        gameState.drawnCard = gameState.discardPile.pop();
      }
      break;

    case 'replace-card':
      if (gameState.drawnCard && gameState.currentTurn === playerId) {
        const playerHand = gameState[`${playerId}Hand`];
        if (!playerHand.revealedCards[action.position]) {
          const oldCard = playerHand.cards[action.position];
          playerHand.cards[action.position] = gameState.drawnCard;
          playerHand.revealedCards[action.position] = true;
          
          if (oldCard) {
            gameState.discardPile.push(oldCard);
          }
          
          gameState.drawnCard = null;
          gameState.currentTurn = playerId === 'player1' ? 'player2' : 'player1';
          
          checkRoundEnd(gameState);
        }
      }
      break;

    case 'discard-drawn-card':
      if (gameState.drawnCard && gameState.currentTurn === playerId) {
        gameState.discardPile.push(gameState.drawnCard);
        gameState.drawnCard = null;
        gameState.gamePhase = 'flip-after-discard';
      }
      break;

    case 'lock-card-after-discard':
      if (gameState.gamePhase === 'flip-after-discard' && gameState.currentTurn === playerId) {
        const playerHand = gameState[`${playerId}Hand`];
        if (!playerHand.revealedCards[action.position]) {
          playerHand.revealedCards[action.position] = true;
          gameState.gamePhase = 'playing';
          gameState.currentTurn = playerId === 'player1' ? 'player2' : 'player1';
          
          checkRoundEnd(gameState);
        }
      }
      break;

    case 'flip-card-directly':
      if (gameState.gamePhase === 'playing' && gameState.currentTurn === playerId) {
        const playerHand = gameState[`${playerId}Hand`];
        if (!playerHand.revealedCards[action.position]) {
          playerHand.revealedCards[action.position] = true;
          gameState.currentTurn = playerId === 'player1' ? 'player2' : 'player1';
          
          checkRoundEnd(gameState);
        }
      }
      break;

    case 'new-round':
      if (gameState.gamePhase === 'round-finished' || gameState.gamePhase === 'game-finished') {
        if (gameState.gamePhase === 'game-finished') {
          // Reset entire game
          Object.assign(gameState, createInitialGameState(gameState.roomCode));
          gameState.connectedPlayers = room.playerCount;
        } else {
          // Reset for new round
          const newDeck = createDeck();
          gameState.player1Hand = {
            cards: [null, null, null, null],
            revealedCards: [false, false, false, false],
            peekedCards: [false, false, false, false]
          };
          gameState.player2Hand = {
            cards: [null, null, null, null],
            revealedCards: [false, false, false, false],
            peekedCards: [false, false, false, false]
          };
          gameState.deck = newDeck;
          gameState.discardPile = [];
          gameState.currentTurn = 'player1';
          gameState.gamePhase = 'initial';
          gameState.peeksRemaining = 2;
          gameState.drawnCard = null;
        }
      }
      break;
  }

  broadcastGameState(room);
};

const checkRoundEnd = (gameState) => {
  const allPlayer1CardsRevealed = gameState.player1Hand.revealedCards.every(r => r);
  const allPlayer2CardsRevealed = gameState.player2Hand.revealedCards.every(r => r);
  
  if (allPlayer1CardsRevealed || allPlayer2CardsRevealed) {
    gameState.gamePhase = 'round-finished';
    
    // Calculate scores (simplified - you may want to import your scoring logic)
    const player1Score = gameState.player1Hand.cards.reduce((sum, card) => {
      if (!card) return sum;
      if (card.rank === 'J' || card.rank === '2') return sum;
      if (card.rank === 'A') return sum + 11;
      if (card.rank === 'K' || card.rank === 'Q') return sum + 10;
      return sum + parseInt(card.rank);
    }, 0);
    
    const player2Score = gameState.player2Hand.cards.reduce((sum, card) => {
      if (!card) return sum;
      if (card.rank === 'J' || card.rank === '2') return sum;
      if (card.rank === 'A') return sum + 11;
      if (card.rank === 'K' || card.rank === 'Q') return sum + 10;
      return sum + parseInt(card.rank);
    }, 0);
    
    gameState.roundScore = { player: player1Score, cpu: player2Score };
    gameState.gameScore.player += player1Score;
    gameState.gameScore.cpu += player2Score;
    
    // Check game end
    if (gameState.gameScore.player >= 100 || gameState.gameScore.cpu >= 100) {
      gameState.gamePhase = 'game-finished';
    }
  }
};

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', rooms: gameRooms.size }));
  } else {
    res.writeHead(404);
    res.end();
  }
});