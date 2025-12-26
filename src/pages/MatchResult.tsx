import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useMatch } from '@/hooks/useMatch';
import { Trophy, Home } from 'lucide-react';

const MatchResult = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { match, loading, error } = useMatch(matchId || null);

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

        {/* Match Summary */}
        <div className="score-card mb-8">
          <h2 className="text-lg font-bold mb-4 text-center">{match.name}</h2>
          
          <div className="space-y-4">
            {/* Team A */}
            <div className={`p-4 rounded-xl ${
              match.winner === 'A' ? 'bg-success/10 border-2 border-success' : 'bg-secondary'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{match.teamA.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ({Math.floor(match.teamA.totalBalls / 6)}.{match.teamA.totalBalls % 6} overs)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {match.teamA.totalRuns}
                    <span className="text-lg text-muted-foreground">/{match.teamA.totalWickets}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Team B */}
            <div className={`p-4 rounded-xl ${
              match.winner === 'B' ? 'bg-success/10 border-2 border-success' : 'bg-secondary'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{match.teamB.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ({Math.floor(match.teamB.totalBalls / 6)}.{match.teamB.totalBalls % 6} overs)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {match.teamB.totalRuns}
                    <span className="text-lg text-muted-foreground">/{match.teamB.totalWickets}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="score-card mb-8">
          <h3 className="font-semibold mb-3">Match Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Overs</span>
              <span>{match.overs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ball Type</span>
              <span className="capitalize">{match.ballType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Turf Type</span>
              <span className="capitalize">{match.turfType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Toss</span>
              <span>
                {match.toss.winner === 'A' ? match.teamA.name : match.teamB.name} 
                {' '}({match.toss.decision})
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={() => navigate('/')}
          className="w-full tap-button bg-primary text-primary-foreground text-lg py-5 font-bold flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </main>
    </div>
  );
};

export default MatchResult;
