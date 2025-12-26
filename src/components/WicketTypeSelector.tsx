import { WicketType } from '@/types/match';

interface WicketTypeSelectorProps {
  onSelect: (type: WicketType, fielder?: string) => void;
  onCancel: () => void;
  batsmanName: string;
  bowlingTeamPlayers: { id: string; name: string }[];
  isFreeHit?: boolean;
}

export const WicketTypeSelector = ({
  onSelect,
  onCancel,
  batsmanName,
  bowlingTeamPlayers,
  isFreeHit,
}: WicketTypeSelectorProps) => {
  const wicketTypes: { type: WicketType; label: string; needsFielder: boolean }[] = [
    { type: 'bowled', label: 'Bowled', needsFielder: false },
    { type: 'lbw', label: 'LBW', needsFielder: false },
    { type: 'caught', label: 'Caught', needsFielder: true },
    { type: 'runout', label: 'Run Out', needsFielder: true },
    { type: 'stumped', label: 'Stumped', needsFielder: true },
    { type: 'hitwicket', label: 'Hit Wicket', needsFielder: false },
  ];

  const handleSelect = (type: WicketType) => {
    const wicketInfo = wicketTypes.find(w => w.type === type);
    if (wicketInfo?.needsFielder) {
      // For caught/runout/stumped, show fielder selection
      const fielder = prompt('Enter fielder name (optional):');
      onSelect(type, fielder || undefined);
    } else {
      onSelect(type);
    }
  };

  // During free hit, only run out is allowed
  const availableTypes = isFreeHit 
    ? wicketTypes.filter(w => w.type === 'runout')
    : wicketTypes;

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-end justify-center z-50">
      <div className="bg-card w-full max-w-md rounded-t-3xl p-6 animate-fade-in safe-area-bottom">
        <h3 className="text-xl font-bold mb-2 text-center">How is {batsmanName} out?</h3>
        
        {isFreeHit && (
          <p className="text-sm text-warning text-center mb-4">
            Free Hit: Only Run Out is allowed
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          {availableTypes.map((wicket) => (
            <button
              key={wicket.type}
              onClick={() => handleSelect(wicket.type)}
              className="tap-button bg-secondary text-secondary-foreground py-4"
            >
              {wicket.label}
            </button>
          ))}
        </div>
        
        <button
          onClick={onCancel}
          className="w-full tap-button bg-muted text-muted-foreground py-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
