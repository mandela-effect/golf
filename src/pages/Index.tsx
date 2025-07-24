import { useEffect } from 'react';
import { GameBoard } from '@/components/GameBoard';
import { useGolfGame } from '@/hooks/useGolfGame';
import { Button } from '@/components/ui/button';

const Index = () => {
  const {
    gameState,
    drawnCard,
    dealInitialCards,
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
        onCardClick={handleCardClick}
        onDeckClick={drawFromDeck}
        onDiscardClick={drawFromDiscard}
        drawnCard={drawnCard}
        onConfirmCard={() => {}}
        onDiscardDrawnCard={discardDrawnCard}
      />
      
      {/* Game Controls */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <Button onClick={newRound} variant="secondary">
          New Round
        </Button>
      </div>
    </div>
  );
};

export default Index;
