import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useMatch, addPlayers, setOpeners, addJokerPlayer } from '@/hooks/useMatch';
import { toast } from '@/hooks/use-toast';
import { Plus, X, Star } from 'lucide-react';

const TeamSetup = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { match, loading, error } = useMatch(matchId || null);
  
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>(['', '']);
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>(['', '']);
  const [step, setStep] = useState<'players' | 'openers'>('players');
  const [striker, setStriker] = useState<string>('');
  const [nonStriker, setNonStriker] = useState<string>('');
  const [bowler, setBowler] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [showJokerInput, setShowJokerInput] = useState(false);
  const [jokerName, setJokerName] = useState('');

  // Skip player entry if teams already have players (2nd innings)
  useEffect(() => {
    if (match && match.teamA.players.length > 0 && match.teamB.players.length > 0) {
      setStep('openers');
    }
  }, [match]);

  const addPlayerField = (team: 'A' | 'B') => {
    if (team === 'A') {
      setTeamAPlayers([...teamAPlayers, '']);
    } else {
      setTeamBPlayers([...teamBPlayers, '']);
    }
  };

  const removePlayerField = (team: 'A' | 'B', index: number) => {
    if (team === 'A') {
      if (teamAPlayers.length > 2) {
        setTeamAPlayers(teamAPlayers.filter((_, i) => i !== index));
      }
    } else {
      if (teamBPlayers.length > 2) {
        setTeamBPlayers(teamBPlayers.filter((_, i) => i !== index));
      }
    }
  };

  const updatePlayer = (team: 'A' | 'B', index: number, value: string) => {
    if (team === 'A') {
      const updated = [...teamAPlayers];
      updated[index] = value;
      setTeamAPlayers(updated);
    } else {
      const updated = [...teamBPlayers];
      updated[index] = value;
      setTeamBPlayers(updated);
    }
  };

  const handleAddJoker = async () => {
    if (!matchId || !jokerName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Enter the joker player name',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await addJokerPlayer(matchId, jokerName.trim());
      toast({
        title: 'Joker Added',
        description: `${jokerName} is now a joker for both teams`,
      });
      setShowJokerInput(false);
      setJokerName('');
    } catch (err) {
      console.error('Error adding joker:', err);
    }
    setSaving(false);
  };

  const savePlayers = async () => {
    if (!matchId) return;

    const teamAFiltered = teamAPlayers.filter(p => p.trim());
    const teamBFiltered = teamBPlayers.filter(p => p.trim());

    if (teamAFiltered.length < 2 || teamBFiltered.length < 2) {
      toast({
        title: 'Minimum Players Required',
        description: 'Each team needs at least 2 players',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await addPlayers(matchId, 'A', teamAFiltered);
      await addPlayers(matchId, 'B', teamBFiltered);
      setStep('openers');
      toast({
        title: 'Players Added',
        description: 'Now select openers',
      });
    } catch (err) {
      console.error('Error saving players:', err);
      toast({
        title: 'Error',
        description: 'Failed to save players',
        variant: 'destructive',
      });
    }
    setSaving(false);
  };

  const startMatch = async () => {
    if (!matchId || !striker || !nonStriker || !bowler) {
      toast({
        title: 'Selection Required',
        description: 'Select both batsmen and bowler',
        variant: 'destructive',
      });
      return;
    }

    if (striker === nonStriker) {
      toast({
        title: 'Invalid Selection',
        description: 'Striker and non-striker must be different',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await setOpeners(matchId, striker, nonStriker, bowler);
      toast({
        title: match?.currentInnings === 2 ? 'Second Innings Started' : 'Match Started',
        description: 'Good luck!',
      });
      navigate(`/match/${matchId}/umpire`);
    } catch (err) {
      console.error('Error starting match:', err);
      toast({
        title: 'Error',
        description: 'Failed to start match',
        variant: 'destructive',
      });
    }
    setSaving(false);
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
        <Header title="Team Setup" showBack />
        <div className="container px-4 py-8 text-center">
          <p className="text-destructive">Match not found</p>
        </div>
      </div>
    );
  }

  const battingTeam = match.battingTeam === 'A' ? match.teamA : match.teamB;
  const bowlingTeam = match.battingTeam === 'A' ? match.teamB : match.teamA;
  const isSecondInnings = match.currentInnings === 2;
  const target = isSecondInnings 
    ? (match.battingTeam === 'A' ? match.teamB.totalRuns : match.teamA.totalRuns) + 1
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header title={isSecondInnings ? "Second Innings Setup" : "Team Setup"} showBack />
      
      <main className="container px-4 py-6 max-w-md mx-auto safe-area-bottom">
        {step === 'players' ? (
          <div className="space-y-8">
            {/* Team A Players */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{match.teamA.name}</h3>
                <button
                  onClick={() => addPlayerField('A')}
                  className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {teamAPlayers.map((player, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={player}
                      onChange={(e) => updatePlayer('A', index, e.target.value)}
                      placeholder={`Player ${index + 1}`}
                      className="flex-1 h-12 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {teamAPlayers.length > 2 && (
                      <button
                        onClick={() => removePlayerField('A', index)}
                        className="p-3 rounded-xl bg-destructive/10 text-destructive"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Team B Players */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{match.teamB.name}</h3>
                <button
                  onClick={() => addPlayerField('B')}
                  className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {teamBPlayers.map((player, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={player}
                      onChange={(e) => updatePlayer('B', index, e.target.value)}
                      placeholder={`Player ${index + 1}`}
                      className="flex-1 h-12 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {teamBPlayers.length > 2 && (
                      <button
                        onClick={() => removePlayerField('B', index)}
                        className="p-3 rounded-xl bg-destructive/10 text-destructive"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Joker Player */}
            {!match.jokerPlayerId && !showJokerInput && (
              <button
                onClick={() => setShowJokerInput(true)}
                className="w-full tap-button bg-warning/20 text-warning py-4 font-semibold flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5" />
                Add Joker Player (Optional)
              </button>
            )}

            {showJokerInput && (
              <div className="score-card bg-warning/10 border-warning/20 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Joker can play for both teams
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={jokerName}
                    onChange={(e) => setJokerName(e.target.value)}
                    placeholder="Joker Player Name"
                    className="flex-1 h-12 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-warning"
                  />
                  <button
                    onClick={handleAddJoker}
                    disabled={!jokerName.trim() || saving}
                    className="px-4 rounded-xl bg-warning text-warning-foreground font-semibold disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <button
                  onClick={() => setShowJokerInput(false)}
                  className="text-sm text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              onClick={savePlayers}
              disabled={saving}
              className={`w-full tap-button bg-primary text-primary-foreground text-lg py-5 font-bold ${
                saving ? 'opacity-50' : ''
              }`}
            >
              {saving ? 'Saving...' : 'Save Players'}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="score-card text-center">
              <p className="text-muted-foreground">{isSecondInnings ? 'Second' : 'First'} Innings</p>
              <p className="text-xl font-bold mt-1">{battingTeam.name} batting</p>
              {target && (
                <p className="text-lg text-primary mt-2">Target: {target}</p>
              )}
            </div>

            {/* Joker restriction notice */}
            {match.jokerPlayerId && (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-3">
                <p className="text-sm text-warning text-center">
                  🃏 Joker can either bat OR bowl at a time
                </p>
              </div>
            )}

            {/* Select Striker */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Select Striker
              </p>
              <div className="grid grid-cols-2 gap-2">
                {battingTeam.players.filter(p => !p.isOut).map((player) => {
                  // Joker restriction: can't bat if selected as bowler
                  const isJokerBowling = player.isJoker && bowler && bowlingTeam.players.find(b => b.id === bowler)?.isJoker;
                  const isDisabled = nonStriker === player.id || isJokerBowling;
                  
                  return (
                    <button
                      key={player.id}
                      onClick={() => setStriker(player.id)}
                      disabled={isDisabled}
                      className={`p-3 rounded-xl text-left transition-all ${
                        striker === player.id
                          ? 'bg-primary text-primary-foreground'
                          : isDisabled
                          ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {player.name} {player.isJoker && '🃏'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Non-Striker */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Select Non-Striker
              </p>
              <div className="grid grid-cols-2 gap-2">
                {battingTeam.players.filter(p => !p.isOut).map((player) => {
                  // Joker restriction: can't bat if selected as bowler, or same as striker
                  const isJokerBowling = player.isJoker && bowler && bowlingTeam.players.find(b => b.id === bowler)?.isJoker;
                  const isDisabled = striker === player.id || isJokerBowling;
                  
                  return (
                    <button
                      key={player.id}
                      onClick={() => setNonStriker(player.id)}
                      disabled={isDisabled}
                      className={`p-3 rounded-xl text-left transition-all ${
                        nonStriker === player.id
                          ? 'bg-primary text-primary-foreground'
                          : isDisabled
                          ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {player.name} {player.isJoker && '🃏'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Bowler */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Select Opening Bowler
              </p>
              <div className="grid grid-cols-2 gap-2">
                {bowlingTeam.players.map((player) => {
                  // Joker restriction: can't bowl if selected as batsman
                  const strikerPlayer = battingTeam.players.find(p => p.id === striker);
                  const nonStrikerPlayer = battingTeam.players.find(p => p.id === nonStriker);
                  const isJokerBatting = player.isJoker && (strikerPlayer?.isJoker || nonStrikerPlayer?.isJoker);
                  
                  return (
                    <button
                      key={player.id}
                      onClick={() => setBowler(player.id)}
                      disabled={isJokerBatting}
                      className={`p-3 rounded-xl text-left transition-all ${
                        bowler === player.id
                          ? 'bg-primary text-primary-foreground'
                          : isJokerBatting
                          ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {player.name} {player.isJoker && '🃏'}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={startMatch}
              disabled={saving || !striker || !nonStriker || !bowler}
              className={`w-full tap-button bg-success text-success-foreground text-lg py-5 font-bold ${
                saving || !striker || !nonStriker || !bowler ? 'opacity-50' : ''
              }`}
            >
              {saving ? 'Starting...' : isSecondInnings ? 'Start Second Innings' : 'Start Match'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeamSetup;
