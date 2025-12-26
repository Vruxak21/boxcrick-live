import { Match, Player } from '@/types/match';

interface BowlerCardProps {
  player: Player | undefined;
  match: Match;
}

export const BowlerCard = ({ player, match }: BowlerCardProps) => {
  if (!player) return null;

  // Calculate bowler stats from balls
  const bowlerBalls = match.balls.filter(b => b.bowlerId === player.id);
  const runs = bowlerBalls.reduce((sum, b) => sum + b.runs + b.extras, 0);
  const wickets = bowlerBalls.filter(b => b.isWicket).length;
  const legalBalls = bowlerBalls.filter(b => !b.extraType || b.extraType === 'noball').length;
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary">
      <div>
        <p className="font-semibold">{player.name}</p>
        <p className="text-xs text-muted-foreground">Bowling</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold">{wickets}-{runs}</p>
        <p className="text-xs text-muted-foreground">({overs}.{balls})</p>
      </div>
    </div>
  );
};
