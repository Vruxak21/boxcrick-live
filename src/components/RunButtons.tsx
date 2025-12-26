interface RunButtonsProps {
  onRun: (runs: number) => void;
  disabled?: boolean;
}

export const RunButtons = ({ onRun, disabled }: RunButtonsProps) => {
  const runs = [0, 1, 2, 3, 4, 6];

  return (
    <div className="grid grid-cols-3 gap-3">
      {runs.map((run) => (
        <button
          key={run}
          onClick={() => onRun(run)}
          disabled={disabled}
          className={`run-btn text-xl py-4 ${
            run === 4 || run === 6 ? 'bg-success hover:bg-success/90' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {run}
        </button>
      ))}
    </div>
  );
};
