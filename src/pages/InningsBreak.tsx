import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useMatch, startSecondInnings, addPlayersToTeam, addJokerPlayer } from '@/hooks/useMatch';
import { toast } from '@/hooks/use-toast';
import { Plus, X, Users, Star } from 'lucide-react';

const InningsBreak = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { match, loading, error } = useMatch(matchId || null);
  
  const [mode, setMode] = useState<'options' | 'addPlayers' | 'addJoker'>('options');
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

    if (teamAFiltered.length === 0 && teamBFiltered.length === 0) {
      toast({
        title: 'No Players Added',
        description: 'Add at least one player or continue without changes',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (teamAFiltered.length > 0) {
        await addPlayersToTeam(matchId, 'A', teamAFiltered);
      }
      if (teamBFiltered.length > 0) {
        await addPlayersToTeam(matchId, 'B', teamBFiltered);
      }
      toast({
        title: 'Players Added',
        description: 'New players have been added to the teams',
      });
      setMode('options');
      setNewTeamAPlayers(['']);
      setNewTeamBPlayers(['']);
    } catch (err) {
      console.error('Error adding players:', err);
    }
    setSaving(false);
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
        description: `${jokerName} is now a joker player for both teams`,
      });
      setMode('options');
      setJokerName('');
    } catch (err) {
      console.error('Error adding joker:', err);
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
              onClick={() => setMode('addPlayers')}
              className="w-full tap-button bg-secondary text-secondary-foreground text-lg py-4 font-semibold flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Add New Players
            </button>
            
            {!match.jokerPlayerId && (
              <button
                onClick={() => setMode('addJoker')}
                className="w-full tap-button bg-warning/20 text-warning text-lg py-4 font-semibold flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5" />
                Add Joker Player
              </button>
            )}
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
                    placeholder={`New Player ${index + 1}`}
                    className="flex-1 h-12 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {newTeamAPlayers.length > 1 && (
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
                    placeholder={`New Player ${index + 1}`}
                    className="flex-1 h-12 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {newTeamBPlayers.length > 1 && (
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

            <div className="space-y-3 pt-4">
              <button
                onClick={handleAddPlayers}
                disabled={saving}
                className="w-full tap-button bg-primary text-primary-foreground py-4 font-bold"
              >
                {saving ? 'Adding...' : 'Add Players'}
              </button>
              <button
                onClick={() => setMode('options')}
                className="w-full tap-button bg-muted text-muted-foreground py-4"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {mode === 'addJoker' && (
          <div className="space-y-6">
            <div className="score-card bg-warning/10 border-warning/20">
              <h3 className="font-bold text-warning mb-2 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Joker Player
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                A joker player belongs to both teams and can bat/bowl for either team.
              </p>
              <input
                type="text"
                value={jokerName}
                onChange={(e) => setJokerName(e.target.value)}
                placeholder="Joker Player Name"
                className="w-full h-12 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-warning"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAddJoker}
                disabled={saving || !jokerName.trim()}
                className={`w-full tap-button bg-warning text-warning-foreground py-4 font-bold ${
                  !jokerName.trim() ? 'opacity-50' : ''
                }`}
              >
                {saving ? 'Adding...' : 'Add Joker Player'}
              </button>
              <button
                onClick={() => setMode('options')}
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
