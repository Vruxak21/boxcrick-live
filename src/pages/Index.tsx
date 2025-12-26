import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MatchCard } from '@/components/MatchCard';
import { getLatestUnfinishedMatch } from '@/hooks/useMatch';
import { Match } from '@/types/match';
import { Circle } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [unfinishedMatch, setUnfinishedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUnfinishedMatch = async () => {
      try {
        const match = await getLatestUnfinishedMatch();
        setUnfinishedMatch(match);
      } catch (error) {
        console.log('No unfinished match found');
      }
      setLoading(false);
    };
    checkUnfinishedMatch();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 max-w-md mx-auto">
        {/* Logo & Branding */}
        <div className="text-center mb-12 mt-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary mb-6">
            <Circle className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            BoxCrick Pro
          </h1>
          <p className="text-muted-foreground text-lg">
            Smart scoring for box cricket & turf matches
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-10">
          <button
            onClick={() => navigate('/create')}
            className="w-full tap-button bg-primary text-primary-foreground text-lg py-5 font-bold"
          >
            Create Match
          </button>
          
          {!loading && unfinishedMatch && (
            <button
              onClick={() => navigate(`/match/${unfinishedMatch.id}/umpire`)}
              className="w-full tap-button bg-secondary text-secondary-foreground text-lg py-5 font-semibold"
            >
              Resume Match
            </button>
          )}
        </div>

        {/* Unfinished Match Card */}
        {!loading && unfinishedMatch && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Unfinished Match
            </p>
            <MatchCard match={unfinishedMatch} />
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            Share match link with spectators for live updates
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
