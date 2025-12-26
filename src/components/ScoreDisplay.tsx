import { Team } from '@/types/match';

interface ScoreDisplayProps {
  team: Team;
  overs: number;
  isLive?: boolean;
  target?: number;
}

export const ScoreDisplay = ({ team, overs, isLive = false, target }: ScoreDisplayProps) => {
  const oversDisplay = `${Math.floor(team.totalBalls / 6)}.${team.totalBalls % 6}`;
  const maxOvers = overs;
  
  return (
    <div className="score-card text-center">
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
        {team.name}
        {isLive && <span className="ml-2 text-accent">● Live</span>}
      </p>
      <div className="flex items-baseline justify-center gap-2">
        <span className="score-display">{team.totalRuns}</span>
        <span className="text-2xl font-bold text-muted-foreground">/{team.totalWickets}</span>
      </div>
      <p className="overs-display mt-1">
        ({oversDisplay}/{maxOvers} overs)
      </p>
      {target && target > 0 && (
        <p className="text-sm font-medium text-primary mt-2">
          Need {target - team.totalRuns + 1} runs from {(maxOvers * 6) - team.totalBalls} balls
        </p>
      )}
    </div>
  );
};
