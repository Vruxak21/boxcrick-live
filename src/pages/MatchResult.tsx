import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useMatch, restartMatch } from '@/hooks/useMatch';
import { Trophy, Home, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { BowlerStats, FallOfWicket } from '@/types/match';

const MatchResult = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { match, loading, error } = useMatch(matchId || null);
  const [expandedTeam, setExpandedTeam] = useState<'A' | 'B' | null>('A');

  const handleRestart = async () => {
    if (!matchId) return;
    await restartMatch(matchId);
    navigate(`/match/${matchId}/toss`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Match Result" />
        <div className="container px-4 py-8 text-center">
          <p className="text-destructive">Match not found</p>
        </div>
      </div>
    );
  }

  const winnerName = match.winner === 'A' 
    ? match.teamA.name 
    : match.winner === 'B' 
    ? match.teamB.name 
    : 'Tie';

  const getStrikeRate = (runs: number, balls: number) => 
    balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';

  const getEconomy = (runs: number, balls: number) =>
    balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';

  const formatOvers = (balls: number) => 
    `${Math.floor(balls / 6)}.${balls % 6}`;

  const renderBattingCard = (team: typeof match.teamA, teamKey: 'A' | 'B') => {
    const players = team.players.filter(p => p.ballsFaced > 0 || p.isOut);
    
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Batting</p>
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
              {players.map(player => (
                <tr key={player.id} className="border-b border-border/50">
                  <td className="py-2">
                    <div>
                      <span className={player.isOut ? 'text-muted-foreground' : 'font-medium'}>
                        {player.name} {player.isJoker && '🃏'}
                      </span>
                      {player.howOut && (
                        <p className="text-xs text-muted-foreground">{player.howOut}</p>
                      )}
                      {!player.isOut && player.ballsFaced > 0 && (
                        <p className="text-xs text-success">not out</p>
                      )}
                    </div>
                  </td>
                  <td className="py-2 text-right font-semibold">{player.runs}</td>
                  <td className="py-2 text-right text-muted-foreground">{player.ballsFaced}</td>
                  <td className="py-2 text-right text-muted-foreground">{player.fours}</td>
                  <td className="py-2 text-right text-muted-foreground">{player.sixes}</td>
                  <td className="py-2 text-right text-muted-foreground">{getStrikeRate(player.runs, player.ballsFaced)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Extras */}
        <div className="text-sm pt-2 border-t border-border">
          <span className="text-muted-foreground">Extras: </span>
          <span className="font-medium">
            {team.extras.wides + team.extras.noBalls + team.extras.byes + team.extras.legByes}
          </span>
          <span className="text-muted-foreground ml-2">
            (W: {team.extras.wides}, NB: {team.extras.noBalls}, B: {team.extras.byes}, LB: {team.extras.legByes})
          </span>
        </div>
        
        {/* Total */}
        <div className="text-sm font-bold pt-1">
          Total: {team.totalRuns}/{team.totalWickets} ({formatOvers(team.totalBalls)} overs)
        </div>
      </div>
    );
  };

  const renderBowlingCard = (teamKey: 'A' | 'B') => {
    // Bowling stats for this team are stored in the opponent's bowlerStats
    const opponentKey = teamKey === 'A' ? 'teamB' : 'teamA';
    const bowlerStats = match.bowlerStats[opponentKey];
    const bowlers = Object.values(bowlerStats).filter((b: BowlerStats) => b.balls > 0);
    
    if (bowlers.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Bowling</p>
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
              {bowlers.map((bowler: BowlerStats) => (
                <tr key={bowler.id} className="border-b border-border/50">
                  <td className="py-2 font-medium">{bowler.name}</td>
                  <td className="py-2 text-right">{formatOvers(bowler.balls)}</td>
                  <td className="py-2 text-right">{bowler.runs}</td>
                  <td className="py-2 text-right font-semibold text-success">{bowler.wickets}</td>
                  <td className="py-2 text-right text-muted-foreground">{bowler.noBalls}</td>
                  <td className="py-2 text-right text-muted-foreground">{bowler.wides}</td>
                  <td className="py-2 text-right text-muted-foreground">{getEconomy(bowler.runs, bowler.balls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFallOfWickets = (teamKey: 'A' | 'B') => {
    const fow = match.fallOfWickets[teamKey === 'A' ? 'teamA' : 'teamB'];
    if (!fow || fow.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Fall of Wickets</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {fow.map((wicket: FallOfWicket, idx: number) => (
            <span key={idx} className="px-2 py-1 bg-destructive/10 text-destructive rounded">
              {wicket.wicketNumber}-{wicket.score} ({wicket.playerName}, {wicket.overs})
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Match Complete" />
      
      <main className="container px-4 py-6 max-w-lg mx-auto safe-area-bottom">
        {/* Trophy & Winner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-warning/20 mb-4">
            <Trophy className="w-10 h-10 text-warning" />
          </div>
          
          {match.winner === 'tie' ? (
            <h1 className="text-2xl font-extrabold mb-1">Match Tied!</h1>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold mb-1">{winnerName}</h1>
              <p className="text-lg text-primary font-semibold">Won the Match!</p>
            </>
          )}
          
          {match.winMargin && match.winner !== 'tie' && (
            <p className="text-muted-foreground mt-1">{match.winMargin}</p>
          )}
        </div>

        {/* Detailed Scorecards */}
        <div className="space-y-4 mb-6">
          {(['A', 'B'] as const).map((teamKey) => {
            const team = teamKey === 'A' ? match.teamA : match.teamB;
            const isExpanded = expandedTeam === teamKey;
            const isWinner = match.winner === teamKey;
            
            return (
              <div
                key={teamKey}
                className={`score-card ${isWinner ? 'border-2 border-success' : ''}`}
              >
                <button
                  onClick={() => setExpandedTeam(isExpanded ? null : teamKey)}
                  className="w-full flex justify-between items-center"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-lg">{team.name}</h3>
                    <p className="text-2xl font-bold">
                      {team.totalRuns}/{team.totalWickets}
                      <span className="text-sm text-muted-foreground ml-2">
                        ({formatOvers(team.totalBalls)})
                      </span>
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-6">
                    {renderBattingCard(team, teamKey)}
                    {renderBowlingCard(teamKey)}
                    {renderFallOfWickets(teamKey)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRestart}
            className="w-full tap-button bg-accent text-accent-foreground text-lg py-5 font-bold flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Restart Match (Same Teams)
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full tap-button bg-primary text-primary-foreground text-lg py-5 font-bold flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </main>
    </div>
  );
};

export default MatchResult;
