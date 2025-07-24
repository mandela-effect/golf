import { useEffect } from 'react';
import { GameBoard } from '@/components/GameBoard';
import { useGolfGame } from '@/hooks/useGolfGame';
import { Button } from '@/components/ui/button';

const Index = () => {
  const {
    gameState,
    drawnCard,
    dealInitialCards,
    peekAtCard,
    drawFromDeck,
    drawFromDiscard,
    replaceCard,
    discardDrawnCard,
    newRound
  } = useGolfGame();

  useEffect(() => {
    if (gameState.gamePhase === 'initial') {
      dealInitialCards();
    }
  }, [dealInitialCards, gameState.gamePhase]);

  const handleCardClick = (position: number) => {
    if (drawnCard && gameState.currentTurn === 'player') {
      replaceCard(position);
    }
  };

  return (
    <div className="min-h-screen bg-felt-green">
      <GameBoard
        gameState={gameState}
        onPeekCard={peekAtCard}
        onCardClick={handleCardClick}
        onDeckClick={drawFromDeck}
        onDiscardClick={drawFromDiscard}
        drawnCard={drawnCard}
        onConfirmCard={() => {}}
        onDiscardDrawnCard={discardDrawnCard}
      />
      {/* Game Controls */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <button
          onClick={newRound}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
        >
          {gameState.gamePhase === 'game-finished' ? 'New Game' : 'New Round'}
        </button>
      </div>
    </div>
  );
};

export default Index;
