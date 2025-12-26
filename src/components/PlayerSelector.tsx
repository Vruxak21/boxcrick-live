import { Player } from '@/types/match';

interface PlayerSelectorProps {
  players: Player[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  title: string;
  maxSelect?: number;
  excludeIds?: string[];
}

export const PlayerSelector = ({ 
  players, 
  selectedIds, 
  onSelect, 
  title, 
  maxSelect = 1,
  excludeIds = []
}: PlayerSelectorProps) => {
  const availablePlayers = players.filter(p => !p.isOut && !excludeIds.includes(p.id));

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {availablePlayers.map((player) => {
          const isSelected = selectedIds.includes(player.id);
          const canSelect = isSelected || selectedIds.length < maxSelect;

          return (
            <button
              key={player.id}
              onClick={() => onSelect(player.id)}
              disabled={!canSelect && !isSelected}
              className={`p-3 rounded-xl text-left transition-all ${
                isSelected 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary hover:bg-secondary/80'
              } ${!canSelect && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <p className="font-medium truncate">{player.name}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
