import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useMatch, updateToss } from '@/hooks/useMatch';
import { toast } from '@/hooks/use-toast';

const Toss = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { match, loading, error } = useMatch(matchId || null);
  
  const [battingTeam, setBattingTeam] = useState<'A' | 'B' | null>(null);

  const confirmTeams = async () => {
    if (!matchId || !battingTeam) return;
    try {
      await updateToss(matchId, battingTeam, 'bat');
      navigate(`/match/${matchId}/setup`);
    } catch (error) {
      console.error('Error saving team selection:', error);
      toast({ title: 'Error', description: 'Failed to save team selection', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Choose Teams" showBack />
        <div className="container px-4 py-8 text-center">
          <p className="text-destructive">Match not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Choose Teams" showBack />
      
      <main className="container px-4 py-8 max-w-md mx-auto">
        {/* Match Info */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold mb-2">{match.name}</h2>
          <p className="text-muted-foreground">
            {match.teamA.name} vs {match.teamB.name}
          </p>
        </div>

        <div className="animate-fade-in space-y-6">
          <div className="score-card text-center">
            <p className="text-muted-foreground mb-1">Choose the teams for the first innings</p>
            <p className="text-sm text-muted-foreground">Select who will bat first. The other team will bowl.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(['A', 'B'] as const).map((team) => (
              <button
                key={team}
                onClick={() => setBattingTeam(team)}
                className={`tap-button text-lg py-6 ${
                  battingTeam === team ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <span className="block font-bold">{team === 'A' ? match.teamA.name : match.teamB.name}</span>
                <span className="block text-sm mt-1 opacity-80">
                  {battingTeam === team ? 'Bats first' : 'Select to bat'}
                </span>
              </button>
            ))}
          </div>
          {battingTeam && (
            <div className="score-card text-center animate-fade-in">
              <p className="font-semibold">
                {battingTeam === 'A' ? match.teamA.name : match.teamB.name} will bat first
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {battingTeam === 'A' ? match.teamB.name : match.teamA.name} will bowl first
              </p>
            </div>
          )}
          <button
            onClick={confirmTeams}
            disabled={!battingTeam}
            className="w-full tap-button bg-success text-success-foreground text-lg py-5 font-bold disabled:opacity-40"
          >
            Confirm & Select Openers
          </button>
        </div>
      </main>
    </div>
  );
};

export default Toss;
