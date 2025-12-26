import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { createMatch } from '@/hooks/useMatch';
import { toast } from '@/hooks/use-toast';

const CreateMatch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    overs: 6,
    ballType: 'tennis' as 'tennis' | 'leather',
    turfType: 'box' as 'box' | 'turf',
    teamAName: '',
    teamBName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.teamAName.trim() || !formData.teamBName.trim()) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const matchId = await createMatch({
        name: formData.name,
        overs: formData.overs,
        ballType: formData.ballType,
        turfType: formData.turfType,
        teamA: { 
          name: formData.teamAName, 
          players: [], 
          totalRuns: 0, 
          totalWickets: 0,
          totalBalls: 0,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 }
        },
        teamB: { 
          name: formData.teamBName, 
          players: [], 
          totalRuns: 0, 
          totalWickets: 0,
          totalBalls: 0,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 }
        },
      });
      
      toast({
        title: 'Match Created',
        description: 'Proceed to toss',
      });
      
      navigate(`/match/${matchId}/toss`);
    } catch (error) {
      console.error('Error creating match:', error);
      toast({
        title: 'Error',
        description: 'Failed to create match. Check Firebase config.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Create Match" showBack />
      
      <main className="container px-4 py-6 max-w-md mx-auto safe-area-bottom">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Match Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Match Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Friday Night League"
              className="w-full h-14 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Overs */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Number of Overs
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[4, 5, 6, 8, 10, 12, 15, 20].map((over) => (
                <button
                  key={over}
                  type="button"
                  onClick={() => setFormData({ ...formData, overs: over })}
                  className={`h-12 rounded-xl font-semibold transition-all ${
                    formData.overs === over
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {over}
                </button>
              ))}
            </div>
          </div>

          {/* Ball Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Ball Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['tennis', 'leather'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, ballType: type })}
                  className={`h-14 rounded-xl font-semibold capitalize transition-all ${
                    formData.ballType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Turf Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Turf Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['box', 'turf'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, turfType: type })}
                  className={`h-14 rounded-xl font-semibold capitalize transition-all ${
                    formData.turfType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Team Names */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Team A Name
              </label>
              <input
                type="text"
                value={formData.teamAName}
                onChange={(e) => setFormData({ ...formData, teamAName: e.target.value })}
                placeholder="Thunder Hawks"
                className="w-full h-14 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Team B Name
              </label>
              <input
                type="text"
                value={formData.teamBName}
                onChange={(e) => setFormData({ ...formData, teamBName: e.target.value })}
                placeholder="Storm Riders"
                className="w-full h-14 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full tap-button bg-primary text-primary-foreground text-lg py-5 font-bold mt-8 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Creating...' : 'Create Match'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default CreateMatch;
