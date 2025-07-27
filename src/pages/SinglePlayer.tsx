import { useEffect, useState } from 'react';
import { GameBoard } from '@/components/GameBoard';
import { useGolfGame } from '@/hooks/useGolfGame';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, HelpCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SinglePlayer = () => {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);
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
      />
      {/* Game Controls */}
      <div className="fixed top-4 right-4 flex flex-col md:flex-row gap-2">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/90 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Menu
        </button>
        <button
          onClick={() => setShowRules(!showRules)}
          className="px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          Rules
        </button>
        <button
          onClick={newRound}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
        >
          {gameState.gamePhase === 'game-finished' ? 'New Game' : 'New Round'}
        </button>
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
              <h4 className="font-semibold mb-1">Special Rules:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Four of a kind = 0 points total</li>
                <li>Locked cards cannot be replaced</li>
                <li>You can flip your own cards without drawing</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SinglePlayer;