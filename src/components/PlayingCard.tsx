import { Card } from '@/types/golf';
import { getSuitSymbol, getSuitColor } from '@/utils/cardUtils';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card: Card | null;
  isRevealed?: boolean;
  isLocked?: boolean;
  isSelectable?: boolean;
  onClick?: () => void;
  className?: string;
}

export const PlayingCard = ({ 
  card, 
  isRevealed = false, 
  isLocked = false, 
  isSelectable = false, 
  onClick,
  className 
}: PlayingCardProps) => {
  if (!card) {
    return (
      <div className={cn(
        "w-16 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20",
        "flex items-center justify-center text-muted-foreground text-xs",
        className
      )}>
        Empty
      </div>
    );
  }

  const suitSymbol = getSuitSymbol(card.suit);
  const suitColor = getSuitColor(card.suit);

  return (
    <div
      onClick={isSelectable ? onClick : undefined}
      className={cn(
        "w-16 h-24 rounded-lg border border-border bg-card shadow-lg",
        "flex flex-col items-center justify-center relative overflow-hidden",
        isSelectable && "cursor-pointer card-hover",
        isLocked && "ring-2 ring-accent ring-opacity-75",
        !isRevealed && "bg-primary pattern-bg",
        className
      )}
    >
      {isRevealed ? (
        <>
          <div className={cn("text-lg font-bold", suitColor)}>
            {card.rank}
          </div>
          <div className={cn("text-xl", suitColor)}>
            {suitSymbol}
          </div>
          {isLocked && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></div>
          )}
        </>
      ) : (
        <div className="text-primary-foreground text-xs font-medium opacity-75">
          GOLF
        </div>
      )}
    </div>
  );
};

export const DeckCard = ({ onClick, isEmpty = false }: { onClick?: () => void; isEmpty?: boolean }) => {
  return (
    <div
      onClick={!isEmpty ? onClick : undefined}
      className={cn(
        "w-16 h-24 rounded-lg border border-border shadow-lg",
        "flex items-center justify-center transition-all duration-300",
        !isEmpty && "bg-primary cursor-pointer card-hover",
        isEmpty && "bg-muted border-dashed border-muted-foreground/30",
        !isEmpty && "pattern-bg"
      )}
    >
      <div className={cn(
        "text-xs font-medium text-center",
        !isEmpty ? "text-primary-foreground opacity-75" : "text-muted-foreground"
      )}>
        {isEmpty ? "EMPTY" : "DECK"}
      </div>
    </div>
  );
};