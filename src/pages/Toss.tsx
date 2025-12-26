import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useMatch, updateToss } from '@/hooks/useMatch';
import { toast } from '@/hooks/use-toast';

const Toss = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { match, loading, error } = useMatch(matchId || null);
  
  const [isFlipping, setIsFlipping] = useState(false);
  const [tossResult, setTossResult] = useState<'A' | 'B' | null>(null);
  const [decision, setDecision] = useState<'bat' | 'bowl' | null>(null);

  const flipToss = () => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    setTossResult(null);
    setDecision(null);

    // Simulate coin flip
    setTimeout(() => {
      const winner = Math.random() < 0.5 ? 'A' : 'B';
      setTossResult(winner);
      setIsFlipping(false);
    }, 2000);
  };

  const confirmToss = async () => {
    if (!matchId || !tossResult || !decision) return;

    try {
      await updateToss(matchId, tossResult, decision);
      toast({
        title: 'Toss Complete',
        description: 'Proceed to add players',
      });
      navigate(`/match/${matchId}/setup`);
    } catch (error) {
      console.error('Error saving toss:', error);
      toast({
        title: 'Error',
        description: 'Failed to save toss result',
        variant: 'destructive',
      });
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
        <Header title="Toss" showBack />
        <div className="container px-4 py-8 text-center">
          <p className="text-destructive">Match not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Toss" showBack />
      
      <main className="container px-4 py-8 max-w-md mx-auto">
        {/* Match Info */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold mb-2">{match.name}</h2>
          <p className="text-muted-foreground">
            {match.teamA.name} vs {match.teamB.name}
          </p>
        </div>

        {/* Coin Flip */}
        <div className="flex justify-center mb-8">
          <div
            className={`w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg ${
              isFlipping ? 'animate-coin-flip' : ''
            }`}
            style={{ perspective: '1000px' }}
          >
            {tossResult ? (
              <span className="text-primary-foreground font-bold text-lg">
                {tossResult === 'A' ? match.teamA.name : match.teamB.name}
              </span>
            ) : (
              <span className="text-primary-foreground font-bold text-2xl">?</span>
            )}
          </div>
        </div>

        {/* Flip Button */}
        {!tossResult && (
          <button
            onClick={flipToss}
            disabled={isFlipping}
            className={`w-full tap-button bg-primary text-primary-foreground text-lg py-5 font-bold mb-6 ${
              isFlipping ? 'opacity-50' : ''
            }`}
          >
            {isFlipping ? 'Flipping...' : 'Flip Toss'}
          </button>
        )}

        {/* Toss Result */}
        {tossResult && (
          <div className="animate-fade-in space-y-6">
            <div className="score-card text-center">
              <p className="text-muted-foreground mb-2">Toss Won By</p>
              <p className="text-2xl font-bold text-primary">
                {tossResult === 'A' ? match.teamA.name : match.teamB.name}
              </p>
            </div>

            {/* Decision */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground text-center">
                Choose to
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDecision('bat')}
                  className={`tap-button text-lg py-6 ${
                    decision === 'bat'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  Bat
                </button>
                <button
                  onClick={() => setDecision('bowl')}
                  className={`tap-button text-lg py-6 ${
                    decision === 'bowl'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  Bowl
                </button>
              </div>
            </div>

            {/* Confirm */}
            {decision && (
              <button
                onClick={confirmToss}
                className="w-full tap-button bg-success text-success-foreground text-lg py-5 font-bold animate-fade-in"
              >
                Confirm & Add Players
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Toss;
