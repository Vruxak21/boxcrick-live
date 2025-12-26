import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useMatch, addPlayers, setOpeners } from '@/hooks/useMatch';
import { toast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';

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
    } catch (error) {
      console.error('Error saving players:', error);
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
        title: 'Match Started',
        description: 'Good luck!',
      });
      navigate(`/match/${matchId}/umpire`);
    } catch (error) {
      console.error('Error starting match:', error);
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

  return (
    <div className="min-h-screen bg-background">
      <Header title="Team Setup" showBack />
      
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
              <p className="text-muted-foreground">First Innings</p>
              <p className="text-xl font-bold mt-1">{battingTeam.name} batting</p>
            </div>

            {/* Select Striker */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Select Striker
              </p>
              <div className="grid grid-cols-2 gap-2">
                {battingTeam.players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setStriker(player.id)}
                    disabled={nonStriker === player.id}
                    className={`p-3 rounded-xl text-left transition-all ${
                      striker === player.id
                        ? 'bg-primary text-primary-foreground'
                        : nonStriker === player.id
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Non-Striker */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Select Non-Striker
              </p>
              <div className="grid grid-cols-2 gap-2">
                {battingTeam.players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setNonStriker(player.id)}
                    disabled={striker === player.id}
                    className={`p-3 rounded-xl text-left transition-all ${
                      nonStriker === player.id
                        ? 'bg-primary text-primary-foreground'
                        : striker === player.id
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Bowler */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Select Opening Bowler
              </p>
              <div className="grid grid-cols-2 gap-2">
                {bowlingTeam.players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setBowler(player.id)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      bowler === player.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startMatch}
              disabled={saving || !striker || !nonStriker || !bowler}
              className={`w-full tap-button bg-success text-success-foreground text-lg py-5 font-bold ${
                saving || !striker || !nonStriker || !bowler ? 'opacity-50' : ''
              }`}
            >
              {saving ? 'Starting...' : 'Start Match'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeamSetup;
