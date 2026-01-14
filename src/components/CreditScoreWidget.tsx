import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CreditScore {
  id: string;
  score: number;
  bureau: string;
  score_date: string;
}

export const CreditScoreWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'personal' | 'business'>('personal');
  const [scores, setScores] = useState<CreditScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCreditScores();
    }
  }, [user]);

  const loadCreditScores = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_scores')
        .select('*')
        .eq('user_id', user?.id)
        .order('score_date', { ascending: false });

      if (error) throw error;
      setScores(data || []);
    } catch (error) {
      console.error('Error loading credit scores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const personalScores = scores.filter(s => ['transunion', 'equifax'].includes(s.bureau.toLowerCase()));
  const businessScores = scores.filter(s => !['transunion', 'equifax'].includes(s.bureau.toLowerCase()));
  
  const displayedScores = activeTab === 'personal' ? personalScores : businessScores;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-muted animate-pulse rounded-full"></div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded-full"></div>
        </div>
        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Tab Buttons - Scrollable on mobile */}
      <div className="inline-flex items-center rounded-full bg-secondary p-1 border border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap touch-manipulation ${
            activeTab === 'personal'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-card-foreground'
          }`}
        >
          Personal
          <span className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-[10px] sm:text-xs rounded-full ${
            activeTab === 'personal' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            {personalScores.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('business')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap touch-manipulation ${
            activeTab === 'business'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-card-foreground'
          }`}
        >
          Business
          <span className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-[10px] sm:text-xs rounded-full ${
            activeTab === 'business' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            {businessScores.length}
          </span>
        </button>
      </div>

      {/* Content */}
      <Card 
        className="border border-border cursor-pointer hover:shadow-md active:scale-[0.99] transition-all duration-200 touch-manipulation"
        onClick={() => navigate('/credit-reports')}
      >
        <CardContent className="p-4 sm:p-6">
          {displayedScores.length === 0 ? (
            <p className="text-sm text-muted-foreground">No credit scores available</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {displayedScores.slice(0, 2).map((score) => (
                <div key={score.id} className="text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {score.bureau}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{score.score}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs sm:text-sm text-muted-foreground">Scores checked daily with VantageScore 3.0</p>
    </div>
  );
};
