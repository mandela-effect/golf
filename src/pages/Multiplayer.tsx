import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MultiplayerGameBoard } from '@/components/MultiplayerGameBoard';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';

const Multiplayer = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();

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
        onNewRound={newRound}
      />
    </div>
  );
};

export default Multiplayer;