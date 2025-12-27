import { useState } from 'react';
import { Player } from '@/types/match';
import { Plus, X, UserPlus, Users } from 'lucide-react';

interface RosterManagerProps {
  teamName: string;
  players: Player[];
  team: 'A' | 'B';
  currentStrikerId: string | null;
  currentNonStrikerId: string | null;
  currentBowlerId: string | null;
  onAddPlayer: (team: 'A' | 'B', name: string) => Promise<void>;
  onDeletePlayer: (team: 'A' | 'B', playerId: string) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export const RosterManager = ({
  teamName,
  players,
  team,
  currentStrikerId,
  currentNonStrikerId,
  currentBowlerId,
  onAddPlayer,
  onDeletePlayer,
  onClose,
}: RosterManagerProps) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newPlayerName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await onAddPlayer(team, newPlayerName.trim());
      setNewPlayerName('');
    } catch (err) {
      setError('Failed to add player');
    }
    setAdding(false);
  };

  const handleDelete = async (playerId: string) => {
    setDeleting(playerId);
    setError(null);
    const result = await onDeletePlayer(team, playerId);
    if (!result.success) {
      setError(result.error || 'Cannot delete player');
    }
    setDeleting(null);
  };

  const isPlayerActive = (playerId: string) => {
    return playerId === currentStrikerId || 
           playerId === currentNonStrikerId || 
           playerId === currentBowlerId;
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-end justify-center z-50">
      <div className="bg-card w-full max-w-md rounded-t-3xl p-6 animate-fade-in safe-area-bottom max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold">{teamName} Roster</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Add new player */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="New player name"
            className="flex-1 h-12 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleAdd}
            disabled={!newPlayerName.trim() || adding}
            className="px-4 rounded-xl bg-success text-success-foreground font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {adding ? '...' : 'Add'}
          </button>
        </div>

        {/* Player list */}
        <div className="space-y-2">
          {players.map((player) => {
            const active = isPlayerActive(player.id);
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  active ? 'bg-primary/10 border border-primary/30' : 'bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {player.name} {player.isJoker && '🃏'}
                  </span>
                  {active && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                  {player.isOut && (
                    <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                      Out
                    </span>
                  )}
                </div>
                {!active && !player.isJoker && (
                  <button
                    onClick={() => handleDelete(player.id)}
                    disabled={deleting === player.id}
                    className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
                  >
                    {deleting === player.id ? (
                      <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Active players and jokers cannot be deleted
        </p>
      </div>
    </div>
  );
};
