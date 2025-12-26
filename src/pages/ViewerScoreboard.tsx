import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { BatsmanCard } from '@/components/BatsmanCard';
import { BowlerCard } from '@/components/BowlerCard';
import { useMatch } from '@/hooks/useMatch';

const ViewerScoreboard = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { match, loading, error } = useMatch(matchId || null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading live scores...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Live Score" />
        <div className="container px-4 py-8 text-center">
          <p className="text-destructive">Match not found</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (match.status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Live
          </span>
        );
      case 'innings_break':
        return (
          <span className="px-3 py-1 rounded-full bg-warning/20 text-warning text-sm font-medium">
            Innings Break
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
            {match.status}
          </span>
        );
    }
  };

  const battingTeam = match.battingTeam === 'A' ? match.teamA : match.teamB;
  const bowlingTeam = match.battingTeam === 'A' ? match.teamB : match.teamA;
  
  const striker = battingTeam.players.find(p => p.id === match.currentBatsmen.striker);
  const nonStriker = battingTeam.players.find(p => p.id === match.currentBatsmen.nonStriker);
  const currentBowler = bowlingTeam.players.find(p => p.id === match.currentBowler);

  const target = match.currentInnings === 2 
    ? (match.battingTeam === 'A' ? match.teamB.totalRuns : match.teamA.totalRuns)
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header title={match.name} />
      
      <main className="container px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Status Badge */}
        <div className="text-center">
          {getStatusBadge()}
        </div>

        {/* Match Info */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {match.overs} overs • {match.ballType} ball • {match.turfType}
          </p>
          {match.toss.winner && (
            <p className="text-sm text-muted-foreground mt-1">
              {match.toss.winner === 'A' ? match.teamA.name : match.teamB.name} won toss, chose to {match.toss.decision}
            </p>
          )}
        </div>

        {/* Current Innings Score */}
        <ScoreDisplay 
          team={battingTeam} 
          overs={match.overs} 
          isLive={match.status === 'live'}
          target={target}
        />

        {/* Second Team Score (if available) */}
        {match.currentInnings === 2 && (
          <div className="score-card text-center opacity-70">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {bowlingTeam.name} (1st innings)
            </p>
            <p className="text-2xl font-bold">
              {bowlingTeam.totalRuns}/{bowlingTeam.totalWickets}
            </p>
          </div>
        )}

        {/* Current Players */}
        {match.status === 'live' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Batting</p>
            {striker && (
              <BatsmanCard player={striker} isStriker />
            )}
            {nonStriker && (
              <BatsmanCard player={nonStriker} />
            )}
            
            <p className="text-sm font-medium text-muted-foreground mt-4">Bowling</p>
            <BowlerCard player={currentBowler} match={match} />
          </div>
        )}

        {/* Winner Display */}
        {match.status === 'completed' && match.winner && (
          <div className="score-card text-center">
            <p className="text-sm text-muted-foreground mb-2">Result</p>
            <p className="text-xl font-bold text-primary">
              {match.winner === 'tie' 
                ? 'Match Tied'
                : `${match.winner === 'A' ? match.teamA.name : match.teamB.name} Won`
              }
            </p>
            {match.winMargin && (
              <p className="text-muted-foreground mt-1">{match.winMargin}</p>
            )}
          </div>
        )}

        {/* Both Teams Final Scores */}
        {match.status === 'completed' && (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="score-card text-center">
              <p className="text-sm text-muted-foreground">{match.teamA.name}</p>
              <p className="text-2xl font-bold">
                {match.teamA.totalRuns}/{match.teamA.totalWickets}
              </p>
            </div>
            <div className="score-card text-center">
              <p className="text-sm text-muted-foreground">{match.teamB.name}</p>
              <p className="text-2xl font-bold">
                {match.teamB.totalRuns}/{match.teamB.totalWickets}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ViewerScoreboard;
