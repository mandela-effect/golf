import { GameState } from '@/types/golf';
import { PlayingCard, DeckCard } from './PlayingCard';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  gameState: GameState;
  onCardClick: (position: number) => void;
  onPeekCard: (position: number) => void;
  onDeckClick: () => void;
  onDiscardClick: () => void;
  drawnCard: any;
  onConfirmCard: () => void;
  onDiscardDrawnCard: () => void;
}

export const GameBoard = ({
  gameState,
  onCardClick,
  onPeekCard,
  onDeckClick,
  onDiscardClick,
  drawnCard,
  onConfirmCard,
  onDiscardDrawnCard
}: GameBoardProps) => {
  const isPlayerTurn = gameState.currentTurn === 'player';
  const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1];
  const isPeekPhase = gameState.gamePhase === 'peek';
  const isPlayingPhase = gameState.gamePhase === 'playing';
  const isRoundFinished = gameState.gamePhase === 'round-finished';
  const isGameFinished = gameState.gamePhase === 'game-finished';
  const isFlipAfterDiscardPhase = gameState.gamePhase === 'flip-after-discard';

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-felt-green min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Golf Card Game</h1>
        <div className="text-lg text-muted-foreground mb-4">
          Target: Get your 4 cards to total exactly 0 points • First to 100 total points loses
        </div>
        
        {/* Game Score */}
        <div className="flex justify-center gap-8 text-xl font-semibold">
          <div className="text-player-area">
            Player: {gameState.gameScore.player}
          </div>
          <div className="text-cpu-area">
            CPU: {gameState.gameScore.cpu}
          </div>
        </div>

        {/* Round Score (if round finished) */}
        {(isRoundFinished || isGameFinished) && (
          <div className="mt-2 text-lg text-accent">
            Last Round - Player: {gameState.roundScore.player}, CPU: {gameState.roundScore.cpu}
          </div>
        )}
      </div>

      {/* CPU Area */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">CPU</h2>
        </div>
        <div className="flex gap-4 justify-center p-4 bg-cpu-area/10 rounded-lg border border-cpu-area/30">
          {gameState.cpuHand.cards.map((card, index) => (
            <PlayingCard
              key={index}
              card={card}
              isRevealed={gameState.cpuHand.revealedCards[index] || isRoundFinished || isGameFinished}
              isLocked={gameState.cpuHand.revealedCards[index]}
            />
          ))}
        </div>
      </div>

      {/* Center Area - Deck and Discard (only show during playing phase) */}
      {isPlayingPhase && (
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
      )}

      {/* Player Area */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Player</h2>
        </div>
        <div className={cn(
          "flex gap-4 justify-center p-4 rounded-lg border",
          "bg-player-area/10 border-player-area/30",
          isPlayerTurn && isPlayingPhase && "ring-2 ring-player-area/50",
          isPeekPhase && "ring-2 ring-accent/50",
          isFlipAfterDiscardPhase && "ring-2 ring-warning/50"
        )}>
          {gameState.playerHand.cards.map((card, index) => (
            <PlayingCard
              key={index}
              card={card}
              isRevealed={
                gameState.playerHand.revealedCards[index] || 
                isRoundFinished || 
                isGameFinished ||
                (isPeekPhase && gameState.playerHand.peekedCards[index])
              }
              isLocked={gameState.playerHand.revealedCards[index]}
              isSelectable={
                (isPeekPhase && !gameState.playerHand.peekedCards[index] && gameState.peeksRemaining > 0) ||
                (isPlayerTurn && !gameState.playerHand.revealedCards[index] && isPlayingPhase) ||
                (isFlipAfterDiscardPhase && !gameState.playerHand.revealedCards[index])
              }
              onClick={() => {
                if (isPeekPhase) {
                  onPeekCard(index);
                } else {
                  onCardClick(index);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Game Status */}
      <div className="text-center">
        {isPeekPhase && (
          <div className="inline-block px-4 py-2 rounded-lg font-medium bg-accent text-accent-foreground">
            Peek Phase: Click {gameState.peeksRemaining} card{gameState.peeksRemaining === 1 ? '' : 's'} to look at {gameState.peeksRemaining === 1 ? 'it' : 'them'}
          </div>
        )}
        
        {isPlayingPhase && (
          <div className={cn(
            "inline-block px-4 py-2 rounded-lg font-medium",
            isPlayerTurn ? "bg-player-area text-white" : "bg-cpu-area text-white"
          )}>
            {drawnCard 
              ? "Choose a card to replace or discard the drawn card"
              : `${isPlayerTurn ? 'Your' : 'CPU'} Turn`
            }
          </div>
        )}

        {isRoundFinished && (
          <div className="inline-block px-4 py-2 rounded-lg font-medium bg-secondary text-secondary-foreground">
            Round Finished! Ready for next round?
          </div>
        )}

        {isGameFinished && (
          <div className="inline-block px-4 py-2 rounded-lg font-medium bg-accent text-accent-foreground">
            Game Over! {gameState.gameScore.player <= gameState.gameScore.cpu ? 'Player' : 'CPU'} Wins!
          </div>
        )}

        {isFlipAfterDiscardPhase && (
          <div className="inline-block px-4 py-2 rounded-lg font-medium bg-warning text-warning-foreground">
            Flip Phase: Click one of your face-down cards to flip it.
          </div>
        )}
      </div>
    </div>
  );
};