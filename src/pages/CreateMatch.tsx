import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { createMatch } from '@/hooks/useMatch';
import { toast } from '@/hooks/use-toast';

const CreateMatch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    overs: '6' as string,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const oversNum = parseInt(formData.overs, 10);
    if (!formData.overs || isNaN(oversNum) || oversNum < 1 || oversNum > 50) {
      toast({
        title: 'Invalid Overs',
        description: 'Please enter overs between 1 and 50',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const matchId = await createMatch({
        overs: parseInt(formData.overs, 10),
      });
      
      toast({
        title: 'Match Created',
        description: 'Proceed to toss',
      });
      
      navigate(`/match/${matchId}/setup`);
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
          {/* Overs */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Number of Overs
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.overs}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, overs: val });
              }}
              placeholder="e.g. 8"
              maxLength={2}
              className="w-full h-14 px-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
