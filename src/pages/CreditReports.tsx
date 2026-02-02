import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, ArrowRight, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModernTabs as Tabs, ModernTabsContent as TabsContent, ModernTabsList as TabsList, ModernTabsTrigger as TabsTrigger } from '@/components/ui/modern-tabs';
import { PageHeader } from '@/components/PageHeader';

export default function CreditReports() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Mock credit data matching Credit Karma style
  const creditData = {
    transUnion: {
      score: 677,
      change: 1,
      rating: 'Fair',
      maxScore: 850
    },
    equifax: {
      score: 710,
      change: 21,
      rating: 'Good',
      maxScore: 850
    },
    scoreHistory: [
      { date: 'Sep 21', score: 670 },
      { date: 'Sep 28', score: 675 },
      { date: 'Oct 05', score: 672 },
      { date: 'Oct 12', score: 676 },
      { date: 'Oct 19', score: 680 },
      { date: 'Oct 26', score: 685 },
      { date: 'Nov 02', score: 677 }
    ],
    factors: [
      { name: 'Payment history', value: 95, status: 'Needs work', impact: 'High impact', icon: 'warning' },
      { name: 'Credit card use', value: 29, status: 'Good', impact: 'High impact', icon: 'check' },
      { name: 'Derogatory marks', value: 0, status: 'Excellent', impact: 'High impact', icon: 'check' },
      { name: 'Credit age', value: '3 yrs, 2 mos', status: 'Needs work', impact: 'Medium impact', icon: 'warning' },
      { name: 'Total accounts', value: 8, status: 'Needs work', impact: 'Low impact', icon: 'warning' },
      { name: 'Hard inquiries', value: 5, status: 'Needs work', impact: 'Low impact', icon: 'warning' }
    ],
    upcomingReports: [
      { account: 'Capital One Credit Card', dueDate: 'Nov 10', balance: '$1,234' }
    ]
  };

  // Mock business credit data
  const businessCreditData = {
    dnb: {
      score: 68,
      change: 3,
      rating: 'Good',
      maxScore: 100
    },
    experian: {
      score: 75,
      change: -2,
      rating: 'Fair',
      maxScore: 100
    },
    scoreHistory: [
      { date: 'Sep 21', score: 65 },
      { date: 'Sep 28', score: 67 },
      { date: 'Oct 05', score: 66 },
      { date: 'Oct 12', score: 69 },
      { date: 'Oct 19', score: 71 },
      { date: 'Oct 26', score: 70 },
      { date: 'Nov 02', score: 68 }
    ],
    factors: [
      { name: 'Payment history', value: 88, status: 'Good', impact: 'High impact', icon: 'check' },
      { name: 'Credit utilization', value: 45, status: 'Needs work', impact: 'High impact', icon: 'warning' },
      { name: 'Public records', value: 0, status: 'Excellent', impact: 'High impact', icon: 'check' },
      { name: 'Business age', value: '5 yrs, 7 mos', status: 'Good', impact: 'Medium impact', icon: 'check' },
      { name: 'Trade lines', value: 12, status: 'Good', impact: 'Medium impact', icon: 'check' },
      { name: 'Credit inquiries', value: 3, status: 'Good', impact: 'Low impact', icon: 'check' }
    ],
    upcomingReports: [
      { account: 'Chase Business Line of Credit', dueDate: 'Nov 15', balance: '$8,450' }
    ]
  };

  const getScoreRating = (score: number) => {
    if (score >= 750) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 700) return { label: 'Good', color: 'text-green-500' };
    if (score >= 650) return { label: 'Fair', color: 'text-yellow-600' };
    if (score >= 600) return { label: 'Poor', color: 'text-orange-600' };
    return { label: 'Very Poor', color: 'text-red-600' };
  };

  const getImpactColor = (impact: string) => {
    if (impact.includes('High')) return 'text-red-600';
    if (impact.includes('Medium')) return 'text-yellow-600';
    return 'text-foreground';
  };

  const getStatusIcon = (icon: string) => {
    if (icon === 'check') return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (icon === 'warning') return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Loading skeleton with banner */}
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-blue-950 animate-pulse">
          <div className="max-w-7xl mx-auto sm:px-6 md:py-[30px] lg:px-[34px] px-[30px] py-[15px]">
            <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-48"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-48 bg-muted rounded-lg"></div>
              <div className="h-48 bg-muted rounded-lg"></div>
            </div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Credit Reports Dashboard" 
        subtitle="Monitor your personal and business credit scores"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Tabs for Personal vs Business */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="business" count={2}>Business Credit</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6 mt-6">
          {/* Dual Credit Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TransUnion Card */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">TransUnion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-end gap-3">
                  <div className={`text-5xl font-bold ${getScoreRating(creditData.transUnion.score).color}`}>
                    {creditData.transUnion.score}
                  </div>
                  <div className="pb-2 text-sm text-foreground">
                    out of {creditData.transUnion.maxScore}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {creditData.transUnion.change > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={creditData.transUnion.change > 0 ? 'text-green-600' : 'text-red-600'}>
                    {creditData.transUnion.change > 0 ? '+' : ''}{creditData.transUnion.change} Point
                  </span>
                  <span className="text-foreground">• {creditData.transUnion.rating}</span>
                </div>
                <p className="text-xs text-foreground">Checked daily</p>
              </CardContent>
            </Card>

            {/* Equifax Card */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Equifax</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-end gap-3">
                  <div className={`text-5xl font-bold ${getScoreRating(creditData.equifax.score).color}`}>
                    {creditData.equifax.score}
                  </div>
                  <div className="pb-2 text-sm text-foreground">
                    out of {creditData.equifax.maxScore}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {creditData.equifax.change > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={creditData.equifax.change > 0 ? 'text-green-600' : 'text-red-600'}>
                    {creditData.equifax.change > 0 ? '+' : ''}{creditData.equifax.change} Points
                  </span>
                  <span className="text-foreground">• {creditData.equifax.rating}</span>
                </div>
                <p className="text-xs text-foreground">Checked daily</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-sm text-foreground">
            Scores checked daily with VantageScore 3.0
          </p>

          {/* Score History Chart */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle>Score Trend</CardTitle>
                  <CardDescription className="text-foreground">Your credit score over the last 3 months</CardDescription>
                </div>
                <Button 
                  variant="link" 
                  className="text-sm w-fit"
                  onClick={() => navigate('/credit-score-simulator')}
                >
                  See what's changed <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end justify-between h-32 gap-1 sm:gap-2">
                  {creditData.scoreHistory.map((point, index) => {
                    const maxScore = Math.max(...creditData.scoreHistory.map(p => p.score));
                    const height = (point.score / maxScore) * 100;
                    return (
                      <div key={index} className="flex flex-col items-center flex-1 gap-1">
                        <div className="w-full bg-primary/20 rounded-t" style={{ height: `${height}%` }}>
                          <div className="w-full h-2 bg-primary rounded-t"></div>
                        </div>
                        <span className="text-[10px] sm:text-xs text-foreground whitespace-nowrap">{point.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Bureau Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming bureau reports</CardTitle>
              <CardDescription className="text-foreground">
                Based on your last credit report, we estimate these accounts will be reported to TransUnion in the next 7 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {creditData.upcomingReports.map((report, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{report.account}</p>
                      <p className="text-xs text-foreground">Due: {report.dueDate}</p>
                    </div>
                    <Badge variant="secondary" className="w-fit">{report.balance}</Badge>
                  </div>
                ))}
              </div>
              <Button 
                variant="link" 
                className="mt-4 p-0 h-auto text-sm w-fit"
                onClick={() => navigate('/credit-score-simulator')}
              >
                Learn how debt reporting works <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Credit Factors */}
          <Card>
            <CardHeader>
              <CardTitle>Credit factors</CardTitle>
              <CardDescription className="text-foreground">
                See what's helping or hurting your score, and what to fix first. Try digging into your credit card use and payment history first. You can improve those factors more quickly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {creditData.factors.map((factor, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(factor.icon)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{factor.name}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold">
                                {typeof factor.value === 'number' && factor.name.includes('use') ? `${factor.value}%` : factor.value}
                              </span>
                            </div>
                          </div>
                          {typeof factor.value === 'number' && factor.name.includes('use') && (
                            <Progress value={factor.value} className="h-2 mb-2" />
                          )}
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant={factor.status === 'Excellent' || factor.status === 'Good' ? 'default' : 'secondary'}>
                              {factor.status}
                            </Badge>
                            <span className={getImpactColor(factor.impact)}>{factor.impact}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-6">
                View full credit report
              </Button>
            </CardContent>
          </Card>

          {/* Suggested Offers Section */}
          <Card>
            <CardHeader>
              <CardTitle>Suggested for your credit</CardTitle>
              <CardDescription className="text-foreground">
                We suggest offers based on your credit, Approval Odds, and money we make from our partners.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-foreground">
                <p className="text-sm">Credit card and loan offers will appear here based on your credit profile.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6 mt-6">
          {/* Dual Business Credit Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dun & Bradstreet Card */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Dun & Bradstreet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-end gap-3">
                  <div className={`text-5xl font-bold ${getScoreRating(businessCreditData.dnb.score * 8.5).color}`}>
                    {businessCreditData.dnb.score}
                  </div>
                  <div className="pb-2 text-sm text-foreground">
                    out of {businessCreditData.dnb.maxScore}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {businessCreditData.dnb.change > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={businessCreditData.dnb.change > 0 ? 'text-green-600' : 'text-red-600'}>
                    {businessCreditData.dnb.change > 0 ? '+' : ''}{businessCreditData.dnb.change} Points
                  </span>
                  <span className="text-foreground">• {businessCreditData.dnb.rating}</span>
                </div>
                <p className="text-xs text-foreground">Updated monthly</p>
              </CardContent>
            </Card>

            {/* Experian Business Card */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Experian Business</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-end gap-3">
                  <div className={`text-5xl font-bold ${getScoreRating(businessCreditData.experian.score * 8.5).color}`}>
                    {businessCreditData.experian.score}
                  </div>
                  <div className="pb-2 text-sm text-foreground">
                    out of {businessCreditData.experian.maxScore}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {businessCreditData.experian.change > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={businessCreditData.experian.change > 0 ? 'text-green-600' : 'text-red-600'}>
                    {businessCreditData.experian.change > 0 ? '+' : ''}{businessCreditData.experian.change} Points
                  </span>
                  <span className="text-foreground">• {businessCreditData.experian.rating}</span>
                </div>
                <p className="text-xs text-foreground">Updated monthly</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-sm text-foreground">
            Business credit scores updated monthly by major commercial credit bureaus
          </p>

          {/* Business Score History Chart */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle>Business Score Trend</CardTitle>
                  <CardDescription className="text-foreground">Your business credit score over the last 3 months</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end justify-between h-32 gap-1 sm:gap-2">
                  {businessCreditData.scoreHistory.map((point, index) => {
                    const maxScore = Math.max(...businessCreditData.scoreHistory.map(p => p.score));
                    const height = (point.score / maxScore) * 100;
                    return (
                      <div key={index} className="flex flex-col items-center flex-1 gap-1">
                        <div className="w-full bg-primary/20 rounded-t" style={{ height: `${height}%` }}>
                          <div className="w-full h-2 bg-primary rounded-t"></div>
                        </div>
                        <span className="text-[10px] sm:text-xs text-foreground whitespace-nowrap">{point.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Business Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming business reports</CardTitle>
              <CardDescription className="text-foreground">
                Based on your business credit report, we estimate these accounts will be reported in the next 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {businessCreditData.upcomingReports.map((report, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{report.account}</p>
                      <p className="text-xs text-foreground">Due: {report.dueDate}</p>
                    </div>
                    <Badge variant="secondary" className="w-fit">{report.balance}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Business Credit Factors */}
          <Card>
            <CardHeader>
              <CardTitle>Business credit factors</CardTitle>
              <CardDescription className="text-foreground">
                Key factors affecting your business credit score. Focus on payment history and credit utilization for the fastest improvements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {businessCreditData.factors.map((factor, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(factor.icon)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{factor.name}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold">
                                {typeof factor.value === 'number' && factor.name.includes('utilization') ? `${factor.value}%` : factor.value}
                              </span>
                            </div>
                          </div>
                          {typeof factor.value === 'number' && factor.name.includes('utilization') && (
                            <Progress value={factor.value} className="h-2 mb-2" />
                          )}
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant={factor.status === 'Excellent' || factor.status === 'Good' ? 'default' : 'secondary'}>
                              {factor.status}
                            </Badge>
                            <span className={getImpactColor(factor.impact)}>{factor.impact}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-6">
                View full business credit report
              </Button>
            </CardContent>
          </Card>

          {/* Business Financing Offers */}
          <Card>
            <CardHeader>
              <CardTitle>Business financing offers</CardTitle>
              <CardDescription className="text-foreground">
                Financing options based on your business credit profile and financial health.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-foreground">
                <p className="text-sm">Business loan and line of credit offers will appear here based on your business credit profile.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
