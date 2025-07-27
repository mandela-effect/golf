import { useEffect } from 'react';
import { GameBoard } from '@/components/GameBoard';
import { useGolfGame } from '@/hooks/useGolfGame';

const SinglePlayer = () => {
  const {
    gameState,
    drawnCard,
    dealInitialCards,
    peekAtCard,
    drawFromDeck,
    drawFromDiscard,
    replaceCard,
    discardDrawnCard,
    lockCardAfterDiscard,
    flipCardDirectly,
    newRound
  } = useGolfGame();

  useEffect(() => {
    if (gameState.gamePhase === 'initial') {
      dealInitialCards();
    }
  }, [dealInitialCards, gameState.gamePhase]);

  const handleCardClick = (position: number) => {
    if (gameState.gamePhase === 'flip-after-discard') {
      lockCardAfterDiscard(position);
    } else if (drawnCard && gameState.currentTurn === 'player') {
      replaceCard(position);
    } else if (!drawnCard && gameState.currentTurn === 'player') {
      flipCardDirectly(position);
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
        onNewRound={newRound}
      />
    </div>
  );
};

export default SinglePlayer;