import { GameState, PlayerHand } from '@/types/golf';
import { PlayingCard, DeckCard } from './PlayingCard';
import { cn } from '@/lib/utils';

interface MultiplayerGameState extends Omit<GameState, 'currentTurn' | 'cpuHand' | 'playerHand'> {
  currentTurn: 'player1' | 'player2';
  player1Hand: PlayerHand;
  player2Hand: PlayerHand;
  playerId: 'player1' | 'player2';
  opponent: 'player1' | 'player2';
  connectedPlayers: number;
  roomCode: string;
}

interface MultiplayerGameBoardProps {
  gameState: MultiplayerGameState;
  onCardClick: (position: number) => void;
  onPeekCard: (position: number) => void;
  onDeckClick: () => void;
  onDiscardClick: () => void;
  drawnCard: any;
  onConfirmCard: () => void;
  onDiscardDrawnCard: () => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const MultiplayerGameBoard = ({
  gameState,
  onCardClick,
  onPeekCard,
  onDeckClick,
  onDiscardClick,
  drawnCard,
  onConfirmCard,
  onDiscardDrawnCard,
  connectionStatus
}: MultiplayerGameBoardProps) => {
  const isMyTurn = gameState.currentTurn === gameState.playerId;
  const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1];
  const isPeekPhase = gameState.gamePhase === 'peek';
  const isPlayingPhase = gameState.gamePhase === 'playing';
  const isRoundFinished = gameState.gamePhase === 'round-finished';
  const isGameFinished = gameState.gamePhase === 'game-finished';
  const isFlipAfterDiscardPhase = gameState.gamePhase === 'flip-after-discard';

  const myHand = gameState.playerId === 'player1' ? gameState.player1Hand : gameState.player2Hand;
  const opponentHand = gameState.playerId === 'player1' ? gameState.player2Hand : gameState.player1Hand;
  const opponentId = gameState.opponent;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-felt-green min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            Room: <span className="font-mono font-bold">{gameState.roomCode}</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Golf Card Game</h1>
          <div className={cn(
            "text-sm px-2 py-1 rounded",
            connectionStatus === 'connected' ? "bg-green-100 text-green-800" :
            connectionStatus === 'connecting' ? "bg-yellow-100 text-yellow-800" :
            "bg-red-100 text-red-800"
          )}>
            {connectionStatus === 'connected' ? `${gameState.connectedPlayers}/2 players` : connectionStatus}
          </div>
        </div>
        
        <div className="text-lg text-muted-foreground mb-4">
          Target: Get your 4 cards to total exactly 0 points • First to 100 total points loses
        </div>
        
        {/* Game Score */}
        <div className="flex justify-center gap-8 text-xl font-semibold">
          <div className={cn(
            gameState.playerId === 'player1' ? "text-player-area" : "text-cpu-area"
          )}>
            You: {gameState.playerId === 'player1' ? gameState.gameScore.player : gameState.gameScore.cpu}
          </div>
          <div className={cn(
            gameState.playerId === 'player1' ? "text-cpu-area" : "text-player-area"
          )}>
            Opponent: {gameState.playerId === 'player1' ? gameState.gameScore.cpu : gameState.gameScore.player}
          </div>
        </div>

        {/* Round Score (if round finished) */}
        {(isRoundFinished || isGameFinished) && (
          <div className="mt-2 text-lg text-accent">
            Last Round - You: {gameState.playerId === 'player1' ? gameState.roundScore.player : gameState.roundScore.cpu}, 
            Opponent: {gameState.playerId === 'player1' ? gameState.roundScore.cpu : gameState.roundScore.player}
          </div>
        )}
      </div>

      {/* Opponent Area */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Opponent ({opponentId})</h2>
        </div>
        <div className="flex gap-4 justify-center p-4 bg-cpu-area/10 rounded-lg border border-cpu-area/30">
          {opponentHand.cards.map((card, index) => (
            <PlayingCard
              key={index}
              card={card}
              // Hide opponent cards during peek phase, show them otherwise if revealed or game ended
              isRevealed={
                isPeekPhase ? false : 
                (opponentHand.revealedCards[index] || isRoundFinished || isGameFinished)
              }
              isLocked={opponentHand.revealedCards[index]}
            />
          ))}
        </div>
      </div>

      {/* Center Area - Deck and Discard (show during playing and flip phases) */}
      {(isPlayingPhase || isFlipAfterDiscardPhase) && (
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Deck</div>
            <DeckCard 
              onClick={isMyTurn && !drawnCard ? onDeckClick : undefined}
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
                isSelectable={isMyTurn && !drawnCard}
                onClick={isMyTurn && !drawnCard ? onDiscardClick : undefined}
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
          <h2 className="text-xl font-semibold text-foreground">You ({gameState.playerId})</h2>
        </div>
        <div className={cn(
          "flex gap-4 justify-center p-4 rounded-lg border",
          "bg-player-area/10 border-player-area/30",
          isMyTurn && isPlayingPhase && "ring-2 ring-player-area/50",
          isPeekPhase && isMyTurn && "ring-2 ring-accent/50",
          isFlipAfterDiscardPhase && isMyTurn && "ring-2 ring-warning/50"
        )}>
          {myHand.cards.map((card, index) => (
            <PlayingCard
              key={index}
              card={card}
              isRevealed={
                myHand.revealedCards[index] || 
                isRoundFinished || 
                isGameFinished ||
                (isPeekPhase && myHand.peekedCards[index])
              }
              isLocked={myHand.revealedCards[index]}
              isSelectable={
                isMyTurn && (
                  (isPeekPhase && !myHand.peekedCards[index] && gameState.peeksRemaining > 0) ||
                  (!myHand.revealedCards[index] && isPlayingPhase) ||
                  (isFlipAfterDiscardPhase && !myHand.revealedCards[index])
                )
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
        {gameState.connectedPlayers < 2 && (
          <div className="inline-block px-4 py-2 rounded-lg font-medium bg-yellow-100 text-yellow-800 mb-4">
            Waiting for opponent to join...
          </div>
        )}

        {isPeekPhase && isMyTurn && (
          <div className="inline-block px-4 py-2 rounded-lg font-medium bg-accent text-accent-foreground">
            Peek Phase: Click {gameState.peeksRemaining} card{gameState.peeksRemaining === 1 ? '' : 's'} to look at {gameState.peeksRemaining === 1 ? 'it' : 'them'}
          </div>
        )}

        {isPeekPhase && !isMyTurn && (
          <div className="inline-block px-4 py-2 rounded-lg font-medium bg-muted text-muted-foreground">
            Opponent is peeking at their cards...
          </div>
        )}
        
        {isPlayingPhase && (
          <div className={cn(
            "inline-block px-4 py-2 rounded-lg font-medium",
            isMyTurn ? "bg-player-area text-white" : "bg-cpu-area text-white"
          )}>
            {drawnCard && isMyTurn
              ? "Choose a card to replace or discard the drawn card"
              : `${isMyTurn ? 'Your' : 'Opponent\'s'} Turn`
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
            Game Over! 
            {(() => {
              const myScore = gameState.playerId === 'player1' ? gameState.gameScore.player : gameState.gameScore.cpu;
              const opponentScore = gameState.playerId === 'player1' ? gameState.gameScore.cpu : gameState.gameScore.player;
              return myScore <= opponentScore ? ' You Win!' : ' Opponent Wins!';
            })()}
          </div>
        )}

        {isFlipAfterDiscardPhase && isMyTurn && (
          <div className="inline-block px-4 py-2 rounded-lg font-medium bg-warning text-warning-foreground">
            Flip Phase: Click one of your face-down cards to flip it.
          </div>
        )}

        {isFlipAfterDiscardPhase && !isMyTurn && (
          <div className="inline-block px-4 py-2 rounded-lg font-medium bg-muted text-muted-foreground">
            Opponent is choosing a card to flip...
          </div>
        )}
      </div>
    </div>
  );
};