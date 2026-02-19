import { Match, Player } from '@/types/match';

interface BowlerCardProps {
  player: Player | undefined;
  match: Match;
}

export const BowlerCard = ({ player, match }: BowlerCardProps) => {
  if (!player) return null;

  // Use the pre-computed bowlerStats (correctly maintained by recordBall for all extra sub-types)
  const bowlingTeamKey = match.bowlingTeam === 'A' ? 'teamA' : 'teamB';
  const stats = match.bowlerStats[bowlingTeamKey]?.[player.id];

  const runs = stats?.runs ?? 0;
  const wickets = stats?.wickets ?? 0;
  const legalBalls = stats?.balls ?? 0;
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
