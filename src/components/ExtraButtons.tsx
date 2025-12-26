import { WicketType } from '@/types/match';

interface ExtraButtonsProps {
  onExtra: (type: 'wide' | 'noball' | 'dead') => void;
  onWicket: () => void;
  disabled?: boolean;
  isFreeHit?: boolean;
}

export const ExtraButtons = ({ onExtra, onWicket, disabled, isFreeHit }: ExtraButtonsProps) => {
  return (
    <div className="space-y-3">
      {isFreeHit && (
        <div className="bg-success/20 border-2 border-success rounded-xl py-3 px-4 text-center animate-pulse">
          <span className="text-success font-bold text-lg">🏏 FREE HIT</span>
        </div>
      )}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => onExtra('wide')}
          disabled={disabled}
          className={`extra-btn text-sm py-4 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Wide
        </button>
        <button
          onClick={() => onExtra('noball')}
          disabled={disabled}
          className={`extra-btn text-sm py-4 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          No Ball
        </button>
        <button
          onClick={() => onExtra('dead')}
          disabled={disabled}
          className={`tap-button bg-muted text-muted-foreground text-sm py-4 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Dead
        </button>
        <button
          onClick={onWicket}
          disabled={disabled}
          className={`wicket-btn text-sm py-4 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Wicket
        </button>
      </div>
    </div>
  );
};
