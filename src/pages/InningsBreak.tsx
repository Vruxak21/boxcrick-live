import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useMatch, startSecondInnings, updateTeamPlayers, addJokerPlayer } from '@/hooks/useMatch';
import { toast } from '@/hooks/use-toast';
import { Plus, X, Users, Star } from 'lucide-react';

const InningsBreak = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { match, loading, error } = useMatch(matchId || null);
  
  const [mode, setMode] = useState<'options' | 'addPlayers'>('options');
  const [newTeamAPlayers, setNewTeamAPlayers] = useState<string[]>(['']);
  const [newTeamBPlayers, setNewTeamBPlayers] = useState<string[]>(['']);
  const [jokerName, setJokerName] = useState('');
  const [saving, setSaving] = useState(false);

  const addPlayerField = (team: 'A' | 'B') => {
    if (team === 'A') {
      setNewTeamAPlayers([...newTeamAPlayers, '']);
    } else {
      setNewTeamBPlayers([...newTeamBPlayers, '']);
    }
  };

  const removePlayerField = (team: 'A' | 'B', index: number) => {
    if (team === 'A') {
      setNewTeamAPlayers(newTeamAPlayers.filter((_, i) => i !== index));
    } else {
      setNewTeamBPlayers(newTeamBPlayers.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (team: 'A' | 'B', index: number, value: string) => {
    if (team === 'A') {
      const updated = [...newTeamAPlayers];
      updated[index] = value;
      setNewTeamAPlayers(updated);
    } else {
      const updated = [...newTeamBPlayers];
      updated[index] = value;
      setNewTeamBPlayers(updated);
    }
  };

  const handleContinue = async () => {
    if (!matchId) return;
    setSaving(true);
    try {
      await startSecondInnings(matchId);
      navigate(`/match/${matchId}/setup`);
    } catch (err) {
      console.error('Error starting second innings:', err);
    }
    setSaving(false);
  };

  const handleAddPlayers = async () => {
    if (!matchId) return;
    
    const teamAFiltered = newTeamAPlayers.filter(p => p.trim());
    const teamBFiltered = newTeamBPlayers.filter(p => p.trim());

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
      await updateTeamPlayers(matchId, 'A', teamAFiltered);
      await updateTeamPlayers(matchId, 'B', teamBFiltered);
      
      // Handle joker update
      const existingJoker = match?.teamA.players.find(p => p.isJoker);
      if (jokerName.trim() && !existingJoker) {
        // Add new joker
        await addJokerPlayer(matchId, jokerName.trim());
      } else if (!jokerName.trim() && existingJoker) {
        // Remove joker - handled by updateTeamPlayers
      } else if (jokerName.trim() && existingJoker && jokerName !== existingJoker.name) {
        // Joker name changed - handled by updateTeamPlayers keeping joker
        // Update joker name by removing and adding
        await addJokerPlayer(matchId, jokerName.trim());
      }
      
      // Start second innings
      await startSecondInnings(matchId);
      
      toast({
        title: 'Teams Updated',
        description: 'Starting second innings',
      });
      
      navigate(`/match/${matchId}/setup`);
    } catch (err) {
      console.error('Error updating teams:', err);
      toast({
        title: 'Error',
        description: 'Failed to update teams',
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
        <Header title="Innings Break" showBack />
        <div className="container px-4 py-8 text-center">
          <p className="text-destructive">Match not found</p>
        </div>
      </div>
    );
  }

  const firstInningsTeam = match.battingTeam === 'A' ? match.teamA : match.teamB;

  return (
    <div className="min-h-screen bg-background">
      <Header title="Innings Break" showBack />
      
      <main className="container px-4 py-6 max-w-md mx-auto safe-area-bottom">
        {/* First Innings Summary */}
        <div className="score-card text-center mb-6">
          <p className="text-muted-foreground text-sm">First Innings Complete</p>
          <h2 className="text-xl font-bold mt-1">{firstInningsTeam.name}</h2>
          <p className="text-4xl font-extrabold text-primary mt-2">
            {firstInningsTeam.totalRuns}/{firstInningsTeam.totalWickets}
          </p>
          <p className="text-muted-foreground">
            ({Math.floor(firstInningsTeam.totalBalls / 6)}.{firstInningsTeam.totalBalls % 6} overs)
          </p>
        </div>

        {mode === 'options' && (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground mb-4">
              Before starting second innings:
            </p>
            
            <button
              onClick={handleContinue}
              disabled={saving}
              className="w-full tap-button bg-primary text-primary-foreground text-lg py-5 font-bold"
            >
              Continue with Same Teams
            </button>
            
            <button
              onClick={() => {
                // Load existing players (excluding joker)
                const teamANames = match.teamA.players.filter(p => !p.isJoker).map(p => p.name);
                const teamBNames = match.teamB.players.filter(p => !p.isJoker).map(p => p.name);
                setNewTeamAPlayers(teamANames.length > 0 ? teamANames : ['', '']);
                setNewTeamBPlayers(teamBNames.length > 0 ? teamBNames : ['', '']);
                // Load joker if exists
                const jokerPlayer = match.teamA.players.find(p => p.isJoker);
                if (jokerPlayer) {
                  setJokerName(jokerPlayer.name);
                }
                setMode('addPlayers');
              }}
              className="w-full tap-button bg-secondary text-secondary-foreground text-lg py-4 font-semibold flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Edit Teams
            </button>
          </div>
        )}

        {mode === 'addPlayers' && (
          <div className="space-y-6">
            {/* Team A New Players */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{match.teamA.name}</h3>
                <button
                  onClick={() => addPlayerField('A')}
                  className="p-2 rounded-lg bg-secondary"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {newTeamAPlayers.map((player, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={player}
                    onChange={(e) => updatePlayer('A', index, e.target.value)}
                    placeholder={`Player ${index + 1}`}
                    className="flex-1 h-12 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {newTeamAPlayers.length > 2 && (
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

            {/* Team B New Players */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{match.teamB.name}</h3>
                <button
                  onClick={() => addPlayerField('B')}
                  className="p-2 rounded-lg bg-secondary"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {newTeamBPlayers.map((player, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={player}
                    onChange={(e) => updatePlayer('B', index, e.target.value)}
                    placeholder={`Player ${index + 1}`}
                    className="flex-1 h-12 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {newTeamBPlayers.length > 2 && (
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

            {/* Joker Player - Optional */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">Joker Player (Optional)</h3>
                <Star className="w-4 h-4 text-warning" />
              </div>
              <input
                type="text"
                value={jokerName}
                onChange={(e) => setJokerName(e.target.value)}
                placeholder="Can play for both teams"
                className="w-full h-12 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-warning"
              />
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={handleAddPlayers}
                disabled={saving}
                className="w-full tap-button bg-primary text-primary-foreground py-4 font-bold"
              >
                {saving ? 'Saving...' : 'Save Changes & Start Second Innings'}
              </button>
              <button
                onClick={() => {
                  setMode('options');
                  setNewTeamAPlayers(['']);
                  setNewTeamBPlayers(['']);
                  setJokerName('');
                }}
                className="w-full tap-button bg-muted text-muted-foreground py-4"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default InningsBreak;
