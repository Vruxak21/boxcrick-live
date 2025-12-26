import { Player } from '@/types/match';

interface BatsmanCardProps {
  player: Player;
  isStriker?: boolean;
}

export const BatsmanCard = ({ player, isStriker = false }: BatsmanCardProps) => {
  const strikeRate = player.ballsFaced > 0 
    ? ((player.runs / player.ballsFaced) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl ${
      isStriker ? 'bg-primary/10 border-2 border-primary' : 'bg-secondary'
    }`}>
      <div className="flex items-center gap-3">
        {isStriker && (
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
        <div>
          <p className="font-semibold">{player.name}</p>
          <p className="text-xs text-muted-foreground">SR: {strikeRate}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-bold">{player.runs}</p>
        <p className="text-xs text-muted-foreground">({player.ballsFaced})</p>
      </div>
    </div>
  );
};
