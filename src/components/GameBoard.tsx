import { GameState } from '@/types/golf';
import { PlayingCard, DeckCard } from './PlayingCard';
import { calculateHandScore } from '@/utils/cardUtils';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  gameState: GameState;
  onCardClick: (position: number) => void;
  onDeckClick: () => void;
  onDiscardClick: () => void;
  drawnCard: any;
  onConfirmCard: () => void;
  onDiscardDrawnCard: () => void;
}

export const GameBoard = ({
  gameState,
  onCardClick,
  onDeckClick,
  onDiscardClick,
  drawnCard,
  onConfirmCard,
  onDiscardDrawnCard
}: GameBoardProps) => {
  const playerScore = calculateHandScore(gameState.playerHand.cards);
  const cpuScore = calculateHandScore(gameState.cpuHand.cards);
  
  const isPlayerTurn = gameState.currentTurn === 'player';
  const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-felt-green min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Golf Card Game</h1>
        <div className="text-lg text-muted-foreground">
          Target: Get your 4 cards to total exactly 0 points
        </div>
      </div>

      {/* CPU Area */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">CPU</h2>
          <div className="text-lg font-medium text-foreground">
            Score: {cpuScore === Infinity ? '?' : cpuScore}
          </div>
        </div>
        <div className="flex gap-4 justify-center p-4 bg-cpu-area/10 rounded-lg border border-cpu-area/30">
          {gameState.cpuHand.cards.map((card, index) => (
            <PlayingCard
              key={index}
              card={card}
              isRevealed={gameState.cpuHand.lockedCards[index] || gameState.gamePhase === 'finished'}
              isLocked={gameState.cpuHand.lockedCards[index]}
            />
          ))}
        </div>
      </div>

      {/* Center Area - Deck and Discard */}
      <div className="flex justify-center gap-8 mb-8">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">Deck</div>
          <DeckCard 
            onClick={isPlayerTurn && !drawnCard ? onDeckClick : undefined}
            isEmpty={gameState.deck.length === 0}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {gameState.deck.length} cards
          </div>
        </div>

        {drawnCard && (
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Drawn Card</div>
            <PlayingCard card={drawnCard} isRevealed={true} />
            <div className="flex gap-2 mt-2">
              <button
                onClick={onConfirmCard}
                className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
              >
                Keep
              </button>
              <button
                onClick={onDiscardDrawnCard}
                className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-xs hover:bg-destructive/90"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">Discard</div>
          {topDiscardCard ? (
            <PlayingCard 
              card={topDiscardCard} 
              isRevealed={true}
              isSelectable={isPlayerTurn && !drawnCard}
              onClick={isPlayerTurn && !drawnCard ? onDiscardClick : undefined}
            />
          ) : (
            <div className="w-16 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center text-muted-foreground text-xs">
              Empty
            </div>
          )}
        </div>
      </div>

      {/* Player Area */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Player</h2>
          <div className="text-lg font-medium text-foreground">
            Score: {playerScore === Infinity ? '?' : playerScore}
          </div>
        </div>
        <div className={cn(
          "flex gap-4 justify-center p-4 rounded-lg border",
          "bg-player-area/10 border-player-area/30",
          isPlayerTurn && "ring-2 ring-player-area/50"
        )}>
          {gameState.playerHand.cards.map((card, index) => (
            <PlayingCard
              key={index}
              card={card}
              isRevealed={gameState.playerHand.lockedCards[index] || gameState.gamePhase === 'finished'}
              isLocked={gameState.playerHand.lockedCards[index]}
              isSelectable={isPlayerTurn && drawnCard && !gameState.playerHand.lockedCards[index]}
              onClick={() => onCardClick(index)}
            />
          ))}
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="text-center">
        <div className={cn(
          "inline-block px-4 py-2 rounded-lg font-medium",
          isPlayerTurn ? "bg-player-area text-white" : "bg-cpu-area text-white"
        )}>
          {drawnCard 
            ? "Choose a card to replace or discard the drawn card"
            : `${isPlayerTurn ? 'Your' : 'CPU'} Turn`
          }
        </div>
      </div>
    </div>
  );
};