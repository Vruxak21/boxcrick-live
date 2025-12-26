import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { BatsmanCard } from '@/components/BatsmanCard';
import { BowlerCard } from '@/components/BowlerCard';
import { RunButtons } from '@/components/RunButtons';
import { ExtraButtons } from '@/components/ExtraButtons';
import { useMatch, recordBall, selectNewBatsman, changeBowler, startSecondInnings } from '@/hooks/useMatch';
import { toast } from '@/hooks/use-toast';
import { Share2, Eye } from 'lucide-react';

const UmpireScoring = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { match, loading, error } = useMatch(matchId || null);
  
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showNewBatsmanModal, setShowNewBatsmanModal] = useState(false);
  const [pendingWicket, setPendingWicket] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleRun = async (runs: number) => {
    if (!matchId || processing) return;
    setProcessing(true);
    try {
      await recordBall(matchId, runs);
    } catch (error) {
      console.error('Error recording ball:', error);
      toast({
        title: 'Error',
        description: 'Failed to record ball',
        variant: 'destructive',
      });
    }
    setProcessing(false);
  };

  const handleExtra = async (type: 'wide' | 'noball' | 'dead') => {
    if (!matchId || processing) return;
    
    if (type === 'dead') {
      // Dead ball - no runs, no ball counted
      return;
    }

    setProcessing(true);
    try {
      await recordBall(matchId, 0, type);
    } catch (error) {
      console.error('Error recording extra:', error);
    }
    setProcessing(false);
  };

  const handleWicket = () => {
    setShowWicketModal(true);
  };

  const confirmWicket = async () => {
    if (!matchId || processing) return;
    setProcessing(true);
    try {
      await recordBall(matchId, 0, undefined, true);
      setShowWicketModal(false);
      
      // Check if need new batsman
      const battingTeam = match?.battingTeam === 'A' ? match.teamA : match?.teamB;
      const availableBatsmen = battingTeam?.players.filter(p => !p.isOut && p.id !== match?.currentBatsmen.nonStriker);
      
      if (availableBatsmen && availableBatsmen.length > 0) {
        setPendingWicket(true);
        setShowNewBatsmanModal(true);
      }
    } catch (error) {
      console.error('Error recording wicket:', error);
    }
    setProcessing(false);
  };

  const handleSelectNewBatsman = async (playerId: string) => {
    if (!matchId) return;
    try {
      await selectNewBatsman(matchId, playerId);
      setShowNewBatsmanModal(false);
      setPendingWicket(false);
    } catch (error) {
      console.error('Error selecting batsman:', error);
    }
  };

  const handleChangeBowler = async (playerId: string) => {
    if (!matchId) return;
    try {
      await changeBowler(matchId, playerId);
      setShowBowlerModal(false);
    } catch (error) {
      console.error('Error changing bowler:', error);
    }
  };

  const handleStartSecondInnings = async () => {
    if (!matchId) return;
    try {
      await startSecondInnings(matchId);
      navigate(`/match/${matchId}/setup`);
    } catch (error) {
      console.error('Error starting second innings:', error);
    }
  };

  const shareMatch = () => {
    const url = `${window.location.origin}/match/${matchId}/view`;
    if (navigator.share) {
      navigator.share({
        title: match?.name || 'Cricket Match',
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied',
        description: 'Share this link with spectators',
      });
    }
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
        <Header title="Scoring" showBack />
        <div className="container px-4 py-8 text-center">
          <p className="text-destructive">Match not found</p>
        </div>
      </div>
    );
  }

  // Handle different match states
  if (match.status === 'completed') {
    navigate(`/match/${matchId}/result`);
    return null;
  }

  if (match.status === 'innings_break') {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Innings Break" showBack />
        <main className="container px-4 py-8 max-w-md mx-auto text-center">
          <div className="score-card mb-8">
            <h2 className="text-xl font-bold mb-4">First Innings Complete</h2>
            <p className="text-3xl font-bold text-primary">
              {match.battingTeam === 'A' ? match.teamA.name : match.teamB.name}
            </p>
            <p className="text-4xl font-extrabold mt-2">
              {match.battingTeam === 'A' ? match.teamA.totalRuns : match.teamB.totalRuns}/
              {match.battingTeam === 'A' ? match.teamA.totalWickets : match.teamB.totalWickets}
            </p>
          </div>
          <button
            onClick={handleStartSecondInnings}
            className="w-full tap-button bg-primary text-primary-foreground text-lg py-5 font-bold"
          >
            Start Second Innings
          </button>
        </main>
      </div>
    );
  }

  if (match.status !== 'live') {
    navigate(`/match/${matchId}/setup`);
    return null;
  }

  const battingTeam = match.battingTeam === 'A' ? match.teamA : match.teamB;
  const bowlingTeam = match.battingTeam === 'A' ? match.teamB : match.teamA;
  
  const striker = battingTeam.players.find(p => p.id === match.currentBatsmen.striker);
  const nonStriker = battingTeam.players.find(p => p.id === match.currentBatsmen.nonStriker);
  const currentBowler = bowlingTeam.players.find(p => p.id === match.currentBowler);
  
  const availableBatsmen = battingTeam.players.filter(
    p => !p.isOut && p.id !== match.currentBatsmen.nonStriker
  );
  
  const target = match.currentInnings === 2 
    ? (match.battingTeam === 'A' ? match.teamB.totalRuns : match.teamA.totalRuns)
    : undefined;

  // Check if over is complete
  const isOverComplete = battingTeam.totalBalls > 0 && battingTeam.totalBalls % 6 === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={match.name} showBack />
      
      <main className="flex-1 container px-4 py-4 max-w-md mx-auto flex flex-col safe-area-bottom">
        {/* Top Actions */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={shareMatch}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-secondary-foreground"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={() => navigate(`/match/${matchId}/view`)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-secondary-foreground"
          >
            <Eye className="w-4 h-4" />
            Viewer Mode
          </button>
        </div>

        {/* Score Display */}
        <ScoreDisplay 
          team={battingTeam} 
          overs={match.overs} 
          isLive 
          target={target}
        />

        {/* Current Players */}
        <div className="mt-4 space-y-3">
          {striker && (
            <BatsmanCard player={striker} isStriker />
          )}
          {nonStriker && (
            <BatsmanCard player={nonStriker} />
          )}
          <button
            onClick={() => setShowBowlerModal(true)}
            className="w-full"
          >
            <BowlerCard player={currentBowler} match={match} />
          </button>
        </div>

        {/* Scoring Controls */}
        <div className="mt-auto pt-6 space-y-4">
          {isOverComplete && (
            <button
              onClick={() => setShowBowlerModal(true)}
              className="w-full tap-button bg-accent text-accent-foreground py-4 font-bold"
            >
              Over Complete - Select New Bowler
            </button>
          )}
          
          <RunButtons 
            onRun={handleRun} 
            disabled={processing || pendingWicket} 
          />
          <ExtraButtons 
            onExtra={handleExtra} 
            onWicket={handleWicket} 
            disabled={processing || pendingWicket}
          />
        </div>
      </main>

      {/* Wicket Confirmation Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-end justify-center z-50">
          <div className="bg-card w-full max-w-md rounded-t-3xl p-6 animate-fade-in safe-area-bottom">
            <h3 className="text-xl font-bold mb-4 text-center">Confirm Wicket</h3>
            <p className="text-muted-foreground text-center mb-6">
              {striker?.name} is out?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowWicketModal(false)}
                className="tap-button bg-secondary text-secondary-foreground py-4"
              >
                Cancel
              </button>
              <button
                onClick={confirmWicket}
                className="tap-button bg-destructive text-destructive-foreground py-4"
              >
                Confirm Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Batsman Modal */}
      {showNewBatsmanModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-end justify-center z-50">
          <div className="bg-card w-full max-w-md rounded-t-3xl p-6 animate-fade-in safe-area-bottom">
            <h3 className="text-xl font-bold mb-4 text-center">Select New Batsman</h3>
            <div className="grid grid-cols-2 gap-3">
              {availableBatsmen.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleSelectNewBatsman(player.id)}
                  className="tap-button bg-secondary text-secondary-foreground py-4"
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Change Bowler Modal */}
      {showBowlerModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-end justify-center z-50">
          <div className="bg-card w-full max-w-md rounded-t-3xl p-6 animate-fade-in safe-area-bottom">
            <h3 className="text-xl font-bold mb-4 text-center">Select Bowler</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {bowlingTeam.players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleChangeBowler(player.id)}
                  className={`tap-button py-4 ${
                    player.id === match.currentBowler
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {player.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowBowlerModal(false)}
              className="w-full tap-button bg-muted text-muted-foreground py-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UmpireScoring;
