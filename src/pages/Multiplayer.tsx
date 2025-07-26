import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MultiplayerGameBoard } from '@/components/MultiplayerGameBoard';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { HelpCircle, ArrowLeft } from 'lucide-react';

const Multiplayer = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);

  if (!roomCode) {
    navigate('/');
    return null;
  }

  const {
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
  } = useMultiplayerGame(roomCode);

  useEffect(() => {
    if (gameState && gameState.gamePhase === 'initial' && gameState.connectedPlayers === 2) {
      dealInitialCards();
    }
  }, [dealInitialCards, gameState?.gamePhase, gameState?.connectedPlayers]);

  const handleCardClick = (position: number) => {
    if (!gameState) return;
    
    if (gameState.gamePhase === 'flip-after-discard') {
      lockCardAfterDiscard(position);
    } else if (drawnCard && gameState.currentTurn === gameState.playerId) {
      replaceCard(position);
    } else if (!drawnCard && gameState.currentTurn === gameState.playerId) {
      flipCardDirectly(position);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-felt-green flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-4">
            {connectionStatus === 'connecting' ? 'Connecting to room...' : 'Connection failed'}
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-felt-green">
      <MultiplayerGameBoard
        gameState={gameState}
        onPeekCard={peekAtCard}
        onCardClick={handleCardClick}
        onDeckClick={drawFromDeck}
        onDiscardClick={drawFromDiscard}
        drawnCard={drawnCard}
        onConfirmCard={() => {}}
        onDiscardDrawnCard={discardDrawnCard}
        connectionStatus={connectionStatus}
      />
      
      {/* Game Controls */}
      <div className="fixed top-4 right-4 flex gap-2">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/90 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Leave
        </button>
        <button
          onClick={() => setShowRules(!showRules)}
          className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          Rules
        </button>
        {(gameState.gamePhase === 'round-finished' || gameState.gamePhase === 'game-finished') && (
          <button
            onClick={newRound}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
          >
            {gameState.gamePhase === 'game-finished' ? 'New Game' : 'New Round'}
          </button>
        )}
      </div>

      {/* Rules Panel */}
      {showRules && (
        <div className="fixed top-16 right-4 w-80 bg-card border border-border rounded-lg shadow-lg p-4 text-card-foreground max-h-96 overflow-y-auto">
          <h3 className="font-bold text-lg mb-3">Golf Card Game Rules</h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Objective:</h4>
              <p>Get your 4 cards to total exactly 0 points. First player to reach 100 total points loses.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-1">Card Values:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Jacks and 2s = 0 points</li>
                <li>Aces = 11 points</li>
                <li>Face cards (K, Q) = 10 points</li>
                <li>All other cards = face value</li>
                <li>Pairs of same rank cancel out (= 0 points)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-1">Game Flow:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Look at 2 of your 4 cards (once only)</li>
                <li>Take turns drawing from deck or discard pile</li>
                <li>Replace one of your cards or flip a face-down card</li>
                <li>Cards become locked (face-up) when revealed</li>
                <li>Round ends when any player has all 4 cards locked</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-1">Multiplayer:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Opponent cards are hidden during peek phase</li>
                <li>Wait for your turn to make moves</li>
                <li>Game syncs in real-time between players</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Multiplayer;