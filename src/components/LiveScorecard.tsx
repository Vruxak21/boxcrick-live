import { Match, BowlerStats, FallOfWicket } from '@/types/match';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { RecentBalls } from '@/components/RecentBalls';

interface LiveScorecardProps {
  match: Match;
}

const formatOvers = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;
const getStrikeRate = (runs: number, balls: number) =>
  balls > 0 ? ((runs / balls) * 100).toFixed(1) : '-';
const getEconomy = (runs: number, balls: number) =>
  balls > 0 ? ((runs / balls) * 6).toFixed(2) : '-';

export const LiveScorecard = ({ match }: LiveScorecardProps) => {
  const [showFow, setShowFow] = useState(false);

  const battingTeam = match.battingTeam === 'A' ? match.teamA : match.teamB;
  const bowlingTeam = match.bowlingTeam === 'A' ? match.teamA : match.teamB;

  const firstInningsTeam = match.currentInnings === 2
    ? (match.bowlingTeam === 'A' ? match.teamA : match.teamB)
    : null;

  const batters = battingTeam.players.filter(
    p => p.ballsFaced > 0 || p.id === match.currentBatsmen.striker || p.id === match.currentBatsmen.nonStriker
  );
  const bowlers: BowlerStats[] = Object.values(
    match.bowlingTeam === 'A' ? match.bowlerStats.teamA : match.bowlerStats.teamB
  );
  const fow: FallOfWicket[] = match.battingTeam === 'A'
    ? match.fallOfWickets.teamA
    : match.fallOfWickets.teamB;

  return (
    <div className="space-y-4">
      {/* 1st innings score (if 2nd innings) */}
      {firstInningsTeam && (
        <div className="score-card flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground">1st Innings</p>
            <p className="font-semibold">{firstInningsTeam.name}</p>
          </div>
          <p className="text-2xl font-bold">
            {firstInningsTeam.totalRuns}/{firstInningsTeam.totalWickets}
            <span className="text-sm text-muted-foreground ml-1">({formatOvers(firstInningsTeam.totalBalls)})</span>
          </p>
        </div>
      )}

      {/* Recent Balls — using shared component */}
      {match.balls.length > 0 && <RecentBalls balls={match.balls} />}

      {/* Batting */}
      <div className="score-card">
        <p className="text-sm font-semibold mb-3">
          Batting — <span className="text-muted-foreground">{battingTeam.name}</span>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Batter</th>
                <th className="pb-2 font-medium text-right">R</th>
                <th className="pb-2 font-medium text-right">B</th>
                <th className="pb-2 font-medium text-right">4s</th>
                <th className="pb-2 font-medium text-right">6s</th>
                <th className="pb-2 font-medium text-right">SR</th>
              </tr>
            </thead>
            <tbody>
              {batters.map(player => {
                const isStriker = player.id === match.currentBatsmen.striker;
                const isNonStriker = player.id === match.currentBatsmen.nonStriker;
                const isAtCrease = isStriker || isNonStriker;
                return (
                  <tr key={player.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-2">
                      <div>
                        <span className={player.isOut ? 'text-muted-foreground' : isAtCrease ? 'font-semibold text-primary' : 'font-medium'}>
                          {player.name}
                          {isStriker && ' *'}
                          {player.isJoker && ' 🃏'}
                        </span>
                        {player.isOut && player.howOut && (
                          <p className="text-xs text-muted-foreground">{player.howOut}</p>
                        )}
                        {isAtCrease && !player.isOut && (
                          <p className="text-xs text-success">batting</p>
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-right font-semibold">{player.runs}</td>
                    <td className="py-2 text-right text-muted-foreground">{player.ballsFaced}</td>
                    <td className="py-2 text-right text-muted-foreground">{player.fours}</td>
                    <td className="py-2 text-right text-muted-foreground">{player.sixes}</td>
                    <td className="py-2 text-right text-muted-foreground">{getStrikeRate(player.runs, player.ballsFaced)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Extras + Total */}
        <div className="mt-3 pt-3 border-t border-border space-y-1">
          <div className="text-sm">
            <span className="text-muted-foreground">Extras: </span>
            <span className="font-medium">
              {battingTeam.extras.wides + battingTeam.extras.noBalls + battingTeam.extras.byes + battingTeam.extras.legByes}
            </span>
            <span className="text-muted-foreground text-xs ml-2">
              (W:{battingTeam.extras.wides} NB:{battingTeam.extras.noBalls} B:{battingTeam.extras.byes} LB:{battingTeam.extras.legByes})
            </span>
          </div>
          <div className="text-sm font-bold">
            Total: {battingTeam.totalRuns}/{battingTeam.totalWickets} ({formatOvers(battingTeam.totalBalls)} ov)
          </div>
        </div>
      </div>

      {/* Bowling */}
      {bowlers.length > 0 && (
        <div className="score-card">
          <p className="text-sm font-semibold mb-3">
            Bowling — <span className="text-muted-foreground">{bowlingTeam.name}</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Bowler</th>
                  <th className="pb-2 font-medium text-right">O</th>
                  <th className="pb-2 font-medium text-right">R</th>
                  <th className="pb-2 font-medium text-right">W</th>
                  <th className="pb-2 font-medium text-right">NB</th>
                  <th className="pb-2 font-medium text-right">WD</th>
                  <th className="pb-2 font-medium text-right">Eco</th>
                </tr>
              </thead>
              <tbody>
                {bowlers.map((bowler: BowlerStats) => {
                  const isCurrent = bowler.id === match.currentBowler;
                  return (
                    <tr key={bowler.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-2">
                        <span className={isCurrent ? 'font-semibold text-primary' : 'font-medium'}>
                          {bowler.name}
                          {isCurrent && ' *'}
                        </span>
                        {isCurrent && <p className="text-xs text-success">bowling</p>}
                      </td>
                      <td className="py-2 text-right">{formatOvers(bowler.balls)}</td>
                      <td className="py-2 text-right">{bowler.runs}</td>
                      <td className="py-2 text-right font-semibold text-destructive">{bowler.wickets}</td>
                      <td className="py-2 text-right text-muted-foreground">{bowler.noBalls}</td>
                      <td className="py-2 text-right text-muted-foreground">{bowler.wides}</td>
                      <td className="py-2 text-right text-muted-foreground">{getEconomy(bowler.runs, bowler.balls)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fall of Wickets */}
      {fow && fow.length > 0 && (
        <div className="score-card">
          <button
            className="w-full flex justify-between items-center"
            onClick={() => setShowFow(v => !v)}
          >
            <p className="text-sm font-semibold">Fall of Wickets</p>
            {showFow ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showFow && (
            <div className="flex flex-wrap gap-2 mt-3">
              {fow.map((wicket: FallOfWicket, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs">
                  {wicket.wicketNumber}-{wicket.score} ({wicket.playerName}, {wicket.overs})
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default LiveScorecard;