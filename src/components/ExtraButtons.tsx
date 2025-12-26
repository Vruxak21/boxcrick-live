interface ExtraButtonsProps {
  onExtra: (type: 'wide' | 'noball' | 'dead') => void;
  onWicket: () => void;
  disabled?: boolean;
}

export const ExtraButtons = ({ onExtra, onWicket, disabled }: ExtraButtonsProps) => {
  return (
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
  );
};
