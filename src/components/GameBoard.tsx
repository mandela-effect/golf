import { GameState } from '@/types/golf';
import { PlayingCard, DeckCard } from './PlayingCard';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GameBoardProps {
  gameState: GameState;
  onCardClick: (position: number) => void;
  onPeekCard: (position: number) => void;
  onDeckClick: () => void;
  onDiscardClick: () => void;
  drawnCard: any;
  onConfirmCard: () => void;
  onDiscardDrawnCard: () => void;
  onNewRound: () => void;
}

export const GameBoard = ({
  gameState,
  onCardClick,
  onPeekCard,
  onDeckClick,
  onDiscardClick,
  drawnCard,
  onConfirmCard,
  onDiscardDrawnCard,
  onNewRound
}: GameBoardProps) => {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground mb-2">Golf Card Game</h1>
            <div className="text-lg text-muted-foreground mb-4">
              Target: Get your 4 cards to total exactly 0 points • First to 100 total points loses
            </div>
          </div>
          
          {/* Game Controls */}
          <div className="flex flex-row gap-2 md:ml-4 relative w-full md:w-auto">
            <button
              onClick={() => navigate('/')}
              className="flex-1 md:flex-none px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/90 flex items-center gap-2 justify-center min-w-[110px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Menu
            </button>
            <div className="relative flex-1 md:flex-none min-w-[110px] flex flex-col items-center">
              <button
                onClick={() => setShowRules(!showRules)}
                className="w-full px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 flex items-center gap-2 justify-center"
              >
                <HelpCircle className="w-4 h-4" />
                Rules
              </button>
              {/* Rules Panel */}
              {showRules && (
                <div
                  className="absolute left-1/2 top-full mt-2 z-50 text-left w-80 bg-card border border-border rounded-lg shadow-lg p-4 text-card-foreground max-h-96 overflow-y-auto"
                  style={{ transform: 'translateX(-50%)' }}
                >
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
            <button
              onClick={onNewRound}
              className="flex-1 md:flex-none px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 min-w-[110px]"
            >
              {gameState.gamePhase === 'game-finished' ? 'New Game' : 'New Round'}
            </button>
          </div>
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
        <div className="p-4 flex bg-cpu-area/10 rounded-lg border border-cpu-area/30">
          <div className="grid grid-cols-4 md:grid-cols-2 gap-4 justify-items-center max-w-xs md:max-w-sm mx-auto">
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
      </div>

      {/* Center Area - Deck and Discard (show during playing and flip phases) */}
      {(isPlayingPhase || isFlipAfterDiscardPhase) && (
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
          "flex p-4 rounded-lg border",
          "bg-player-area/10 border-player-area/30",
          isPlayerTurn && isPlayingPhase && "ring-2 ring-player-area/50",
          isPeekPhase && "ring-2 ring-accent/50",
          isFlipAfterDiscardPhase && "ring-2 ring-warning/50"
        )}>
          <div className="grid grid-cols-4 md:grid-cols-2 gap-4 justify-items-center max-w-xs md:max-w-sm mx-auto">
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