import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useMatch, restartMatch } from '@/hooks/useMatch';
import { Trophy, Home, RotateCcw } from 'lucide-react';

const MatchResult = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { match, loading, error } = useMatch(matchId || null);

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

  return (
    <div className="min-h-screen bg-background">
      <Header title="Match Complete" />
      
      <main className="container px-4 py-8 max-w-md mx-auto">
        {/* Trophy & Winner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-warning/20 mb-6">
            <Trophy className="w-12 h-12 text-warning" />
          </div>
          
          {match.winner === 'tie' ? (
            <h1 className="text-3xl font-extrabold mb-2">Match Tied!</h1>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold mb-2">{winnerName}</h1>
              <p className="text-xl text-primary font-semibold">Won the Match!</p>
            </>
          )}
          
          {match.winMargin && match.winner !== 'tie' && (
            <p className="text-lg text-muted-foreground mt-2">{match.winMargin}</p>
          )}
        </div>

        {/* Team Scores */}
        <div className="space-y-4 mb-8">
          {[match.teamA, match.teamB].map((team, idx) => (
            <div key={idx} className={`score-card ${
              match.winner === (idx === 0 ? 'A' : 'B') ? 'border-2 border-success' : ''
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">{team.name}</h3>
                <p className="text-2xl font-bold">
                  {team.totalRuns}/{team.totalWickets}
                  <span className="text-sm text-muted-foreground ml-2">
                    ({Math.floor(team.totalBalls / 6)}.{team.totalBalls % 6})
                  </span>
                </p>
              </div>

              {/* Batting Scorecard */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Batting</p>
                <div className="space-y-1 text-sm">
                  {team.players.filter(p => p.ballsFaced > 0 || p.isOut).map(player => (
                    <div key={player.id} className="flex justify-between">
                      <span className={player.isOut ? 'text-muted-foreground' : 'font-medium'}>
                        {player.name} {player.isJoker && '🃏'}
                      </span>
                      <span>
                        {player.runs}({player.ballsFaced}) 
                        <span className="text-muted-foreground ml-1">
                          SR: {getStrikeRate(player.runs, player.ballsFaced)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extras */}
              <div className="text-sm text-muted-foreground">
                Extras: {team.extras.wides + team.extras.noBalls + team.extras.byes + team.extras.legByes}
                <span className="ml-1">
                  (W: {team.extras.wides}, NB: {team.extras.noBalls})
                </span>
              </div>
            </div>
          ))}
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
