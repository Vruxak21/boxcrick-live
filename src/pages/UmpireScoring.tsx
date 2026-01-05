import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { BatsmanCard } from '@/components/BatsmanCard';
import { BowlerCard } from '@/components/BowlerCard';
import { RunButtons } from '@/components/RunButtons';
import { ExtraButtons } from '@/components/ExtraButtons';
import { WicketTypeSelector } from '@/components/WicketTypeSelector';
import { RosterManager } from '@/components/RosterManager';
import { useMatch, recordBall, selectNewBatsman, changeBowler, addPlayerDuringMatch, deletePlayerDuringMatch, enableMatchSharing } from '@/hooks/useMatch';
import { isFirebaseEnabled } from '@/lib/firebase';
import { useFullscreen } from '@/hooks/useFullscreen';
import { toast } from '@/hooks/use-toast';
import { Share2, Eye, Maximize, Minimize, Users } from 'lucide-react';
import { WicketType } from '@/types/match';

const UmpireScoring = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { match, loading, error } = useMatch(matchId || null);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showNewBatsmanModal, setShowNewBatsmanModal] = useState(false);
  const [showNoBallRunsModal, setShowNoBallRunsModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState<'A' | 'B' | null>(null);
  const [pendingWicket, setPendingWicket] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastOverHandled, setLastOverHandled] = useState(0);

  // Auto-open bowler modal when over is complete
  useEffect(() => {
    if (match && match.status === 'live') {
      const battingTeam = match.battingTeam === 'A' ? match.teamA : match.teamB;
      const currentOverNumber = Math.floor(battingTeam.totalBalls / 6);
      const isOverComplete = battingTeam.totalBalls > 0 && battingTeam.totalBalls % 6 === 0;
      
      if (isOverComplete && !showBowlerModal && !processing && !pendingWicket && currentOverNumber > lastOverHandled) {
        setShowBowlerModal(true);
        setLastOverHandled(currentOverNumber);
      }
    }
  }, [match?.teamA.totalBalls, match?.teamB.totalBalls, match?.status, showBowlerModal, processing, pendingWicket, lastOverHandled]);

  const handleRun = async (runs: number) => {
    if (!matchId || processing) return;
    setProcessing(true);
    try {
      await recordBall(matchId, { runs });
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
      return;
    }

    if (type === 'noball') {
      setShowNoBallRunsModal(true);
      return;
    }

    setProcessing(true);
    try {
      await recordBall(matchId, { runs: 0, extraType: type });
    } catch (error) {
      console.error('Error recording extra:', error);
    }
    setProcessing(false);
  };

  const handleNoBallWithRuns = async (runsOffBat: number) => {
    if (!matchId || processing) return;
    setProcessing(true);
    try {
      await recordBall(matchId, { runs: 0, extraType: 'noball', runsOffBat });
      setShowNoBallRunsModal(false);
    } catch (error) {
      console.error('Error recording no ball:', error);
    }
    setProcessing(false);
  };

  const handleWicket = () => {
    setShowWicketModal(true);
  };

  const confirmWicket = async (wicketType: WicketType, fielder?: string) => {
    if (!matchId || processing) return;
    setProcessing(true);
    try {
      await recordBall(matchId, { runs: 0, isWicket: true, wicketType, fielder });
      setShowWicketModal(false);
      
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

  const handleStartSecondInnings = () => {
    if (!matchId) return;
    navigate(`/match/${matchId}/innings-break`);
  };

  const shareMatch = async () => {
    if (!matchId) return;
    
    const url = `${window.location.origin}/match/${matchId}/view`;
    
    // Enable Firebase sharing if configured
    if (isFirebaseEnabled()) {
      const success = await enableMatchSharing(matchId);
      if (!success) {
        toast({
          title: 'Sharing Error',
          description: 'Could not enable real-time sharing. Check Firebase config.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Share or copy link
    if (navigator.share) {
      navigator.share({
        title: match?.name || 'Cricket Match',
        text: 'Watch live cricket match scores',
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied',
        description: isFirebaseEnabled() 
          ? 'Share this link - it updates in real-time!'
          : 'Share this link (works on same device only)',
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

  if (match.status === 'completed') {
    navigate(`/match/${matchId}/result`);
    return null;
  }

  if (match.status === 'created') {
    navigate(`/match/${matchId}/toss`);
    return null;
  }

  if (match.status === 'toss' || match.status === 'setup') {
    navigate(`/match/${matchId}/setup`);
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

  // If status is not 'live', should have been redirected above
  if (match.status !== 'live') {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Scoring" showBack />
        <div className="container px-4 py-8 text-center">
          <p className="text-destructive">Invalid match status</p>
        </div>
      </div>
    );
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

  const isOverComplete = battingTeam.totalBalls > 0 && battingTeam.totalBalls % 6 === 0;

  return (
    <div className={`min-h-screen bg-background flex flex-col ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {!isFullscreen && <Header title={match.name} showBack />}
      
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
            Viewer
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-4 py-3 rounded-xl bg-secondary text-secondary-foreground"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>

        {/* Score Display */}
        <ScoreDisplay 
          team={battingTeam} 
          overs={match.overs} 
          isLive 
          target={target}
        />

        {/* Roster Edit Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowRosterModal(match.battingTeam)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-muted text-muted-foreground text-sm"
          >
            <Users className="w-4 h-4" />
            {battingTeam.name}
          </button>
          <button
            onClick={() => setShowRosterModal(match.bowlingTeam)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-muted text-muted-foreground text-sm"
          >
            <Users className="w-4 h-4" />
            {bowlingTeam.name}
          </button>
        </div>

        {/* Free Hit Indicator */}
        {match.isFreeHit && (
          <div className="mt-3 bg-success/20 border border-success/40 rounded-xl p-3 text-center">
            <span className="text-lg font-bold text-success">🎯 FREE HIT</span>
          </div>
        )}

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
          <RunButtons 
            onRun={handleRun} 
            disabled={processing || pendingWicket} 
          />
          <ExtraButtons 
            onExtra={handleExtra} 
            onWicket={handleWicket} 
            disabled={processing || pendingWicket}
            isFreeHit={match.isFreeHit}
          />
        </div>
      </main>

      {/* Wicket Type Selection Modal */}
      {showWicketModal && striker && (
        <WicketTypeSelector
          batsmanName={striker.name}
          bowlingTeamPlayers={bowlingTeam.players}
          onSelect={confirmWicket}
          onCancel={() => setShowWicketModal(false)}
          isFreeHit={match.isFreeHit}
        />
      )}

      {/* No Ball Runs Modal */}
      {showNoBallRunsModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-end justify-center z-50">
          <div className="bg-card w-full max-w-md rounded-t-3xl p-6 animate-fade-in safe-area-bottom">
            <h3 className="text-xl font-bold mb-4 text-center">Runs off No Ball</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              1 run added as no ball. How many runs scored off the bat?
            </p>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[0, 1, 2, 3, 4, 6].map((runs) => (
                <button
                  key={runs}
                  onClick={() => handleNoBallWithRuns(runs)}
                  className={`tap-button py-4 text-lg ${
                    runs === 4 || runs === 6 ? 'bg-success text-success-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {runs}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNoBallRunsModal(false)}
              className="w-full tap-button bg-muted text-muted-foreground py-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* New Batsman Modal */}
      {showNewBatsmanModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-end justify-center z-50">
          <div className="bg-card w-full max-w-md rounded-t-3xl p-6 animate-fade-in safe-area-bottom">
            <h3 className="text-xl font-bold mb-4 text-center">Select New Batsman</h3>
            
            {/* Joker restriction notice */}
            {match.jokerPlayerId && (
              <p className="text-xs text-warning text-center mb-3">
                🃏 Joker cannot bat if currently bowling
              </p>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              {availableBatsmen.map((player) => {
                // Joker restriction: can't bat if joker is bowling
                const isJokerBowling = player.isJoker && 
                  bowlingTeam.players.find(b => b.id === match.currentBowler)?.isJoker;
                
                return (
                  <button
                    key={player.id}
                    onClick={() => handleSelectNewBatsman(player.id)}
                    disabled={isJokerBowling}
                    className={`tap-button py-4 ${
                      isJokerBowling
                        ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {player.name} {player.isJoker && '🃏'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Change Bowler Modal */}
      {showBowlerModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-end justify-center z-50">
          <div className="bg-card w-full max-w-md rounded-t-3xl p-6 animate-fade-in safe-area-bottom">
            <h3 className="text-xl font-bold mb-4 text-center">Select Bowler</h3>
            
            {/* Joker restriction notice */}
            {match.jokerPlayerId && (
              <p className="text-xs text-warning text-center mb-3">
                🃏 Joker cannot bowl if currently batting
              </p>
            )}
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {bowlingTeam.players.map((player) => {
                // Joker restriction: can't bowl if currently batting
                const isJokerBatting = player.isJoker && (
                  battingTeam.players.find(p => p.id === match.currentBatsmen.striker)?.isJoker ||
                  battingTeam.players.find(p => p.id === match.currentBatsmen.nonStriker)?.isJoker
                );
                
                return (
                  <button
                    key={player.id}
                    onClick={() => handleChangeBowler(player.id)}
                    disabled={isJokerBatting}
                    className={`tap-button py-4 ${
                      player.id === match.currentBowler
                        ? 'bg-primary text-primary-foreground'
                        : isJokerBatting
                        ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {player.name} {player.isJoker && '🃏'}
                  </button>
                );
              })}
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

      {/* Roster Manager Modal */}
      {showRosterModal && (
        <RosterManager
          teamName={showRosterModal === 'A' ? match.teamA.name : match.teamB.name}
          players={showRosterModal === 'A' ? match.teamA.players : match.teamB.players}
          team={showRosterModal}
          currentStrikerId={match.currentBatsmen.striker}
          currentNonStrikerId={match.currentBatsmen.nonStriker}
          currentBowlerId={match.currentBowler}
          onAddPlayer={async (team, name) => {
            if (matchId) await addPlayerDuringMatch(matchId, team, name);
          }}
          onDeletePlayer={async (team, playerId) => {
            if (matchId) return await deletePlayerDuringMatch(matchId, team, playerId);
            return { success: false, error: 'No match ID' };
          }}
          onClose={() => setShowRosterModal(null)}
        />
      )}
    </div>
  );
};

export default UmpireScoring;
