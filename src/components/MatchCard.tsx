import { Match } from '@/types/match';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  onDelete?: () => void;
}

export const MatchCard = ({ match, onDelete }: MatchCardProps) => {
  const navigate = useNavigate();
  
  const getStatusLabel = () => {
    switch (match.status) {
      case 'created': return 'Pending Toss';
      case 'toss': return 'Toss Done';
      case 'setup': return 'Setting Up';
      case 'live': return 'Live';
      case 'innings_break': return 'Innings Break';
      case 'completed': return 'Completed';
      default: return match.status;
    }
  };

  return (
    <div
      onClick={() => navigate(`/match/${match.id}/umpire`)}
      className="score-card w-full text-left hover:border-primary transition-colors cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') navigate(`/match/${match.id}/umpire`);
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg">{match.name}</h3>
          <p className="text-sm text-muted-foreground">
            {match.overs} overs • {match.ballType} • {match.turfType}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            match.status === 'live' 
              ? 'bg-accent/20 text-accent' 
              : 'bg-secondary text-secondary-foreground'
          }`}>
            {getStatusLabel()}
          </span>
          {onDelete && (
            <button
              type="button"
              aria-label="Delete unfinished match"
              title="Delete unfinished match"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="p-2 rounded-lg text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-sm text-muted-foreground">{match.teamA.name}</p>
          <p className="text-xl font-bold">
            {match.teamA.totalRuns}/{match.teamA.totalWickets}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{match.teamB.name}</p>
          <p className="text-xl font-bold">
            {match.teamB.totalRuns}/{match.teamB.totalWickets}
          </p>
        </div>
      </div>
    </div>
  );
};
