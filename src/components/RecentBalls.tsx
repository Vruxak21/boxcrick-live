import { Ball } from '@/types/match';

interface RecentBallsProps {
  balls: Ball[];
  /** How many of the most recent balls to show. Defaults to 30 (5 overs) */
  limit?: number;
}

export const getBallLabel = (ball: Ball): string => {
  if (ball.isWicket) {
    const baseRuns = ball.runsOffBat ?? 0;
    return baseRuns > 0 ? `W+${baseRuns}` : 'W';
  }
  if (ball.extraType === 'noball') {
    const sub = ball.noballSubType ?? 'bat';
    if (sub === 'wide') {
      const extra = ball.byeRuns ?? 0;
      return extra > 0 ? `NBW+${extra}` : 'NBW';
    }
    if (sub === 'byes') return `NB+${ball.byeRuns ?? 0}b`;
    if (sub === 'legbyes') return `NB+${ball.legbyeRuns ?? 0}lb`;
    if (sub === 'dead') return 'NB';
    const r = ball.runsOffBat ?? 0;
    return r > 0 ? `NB+${r}` : 'NB';
  }
  if (ball.extraType === 'wide') return `Wd${ball.runs > 0 ? `+${ball.runs}` : ''}`;
  if (ball.extraType === 'dead') return 'D';
  return String(ball.runs);
};

export const getBallColor = (ball: Ball): string => {
  if (ball.isWicket) return 'bg-destructive text-destructive-foreground';
  if (ball.extraType === 'noball') return 'bg-warning/20 text-warning border border-warning/40';
  if (ball.extraType === 'wide') return 'bg-warning/20 text-warning border border-warning/40';
  if (ball.runs === 4) return 'bg-success/20 text-success border border-success/40';
  if (ball.runs === 6) return 'bg-success text-success-foreground';
  if (ball.runs === 0) return 'bg-muted text-muted-foreground';
  return 'bg-secondary text-secondary-foreground';
};

/** Groups balls by over number */
const groupByOver = (balls: Ball[]): { over: number; balls: Ball[] }[] => {
  const map = new Map<number, Ball[]>();
  for (const ball of balls) {
    const key = ball.over;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ball);
  }
  // Return sorted descending (most recent over first)
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([over, balls]) => ({ over, balls }));
};

export const RecentBalls = ({ balls, limit = 30 }: RecentBallsProps) => {
  if (balls.length === 0) return null;

  const recent = balls.slice(-limit);
  const overs = groupByOver(recent);

  return (
    <div className="score-card space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Recent Balls
      </p>
      {overs.map(({ over, balls: overBalls }) => (
        <div key={over} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8 shrink-0">
            Ov {over + 1}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {overBalls.map((ball) => (
              <span
                key={ball.id}
                className={`min-w-[2rem] h-8 px-1.5 rounded-full flex items-center justify-center text-xs font-bold ${getBallColor(ball)}`}
              >
                {getBallLabel(ball)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
