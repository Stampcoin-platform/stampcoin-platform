import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Database, Zap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<string>('');

  // Queries
  const { data: statusData, refetch: refetchStatus, isLoading: statusLoading } = 
    trpc.archive.getDatabaseStatus.useQuery();

  // Mutations
  const seedMutation = trpc.archive.seedDatabase.useMutation({
    onSuccess: (data) => {
      toast.success('Database seeding completed!', {
        description: `Imported ${data.data?.success || 0} stamps successfully`,
      });
      refetchStatus();
      setIsSeeding(false);
      setSeedProgress('');
    },
    onError: (error) => {
      toast.error('Seeding failed', {
        description: error.message || 'An error occurred during seeding',
      });
      setIsSeeding(false);
    },
  });

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedProgress('Initializing database import...');
    
    try {
      await seedMutation.mutateAsync();
    } catch (err) {
      console.error('Seeding error:', err);
    }
  };

  const status = statusData?.data;
  const isPopulated = status?.populated;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Admin Dashboard</h1>
          <p className="text-slate-400">Manage StampCoin platform data and operations</p>
        </div>

        {/* Database Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Stamps in Archive</p>
                  <p className="text-3xl font-bold text-white">
                    {statusLoading ? '—' : status?.stampsInArchive || 0}
                  </p>
                </div>
                <Database className="w-8 h-8 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">NFTs Minted</p>
                  <p className="text-3xl font-bold text-white">
                    {statusLoading ? '—' : status?.nftsMinted || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Price Records</p>
                  <p className="text-3xl font-bold text-white">
                    {statusLoading ? '—' : status?.priceRecords || 0}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Currency</p>
                  <p className="text-3xl font-bold text-white">
                    {status?.currency ? 'STMP' : '—'}
                  </p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Population Status */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Database Status</CardTitle>
                <CardDescription>
                  {isPopulated ? 'Database is populated with stamp data' : 'Database needs to be populated'}
                </CardDescription>
              </div>
              <Badge variant={isPopulated ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                {isPopulated ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ready
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Empty
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPopulated && (
              <Alert className="bg-amber-900/20 border-amber-700">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-200">
                  Click "Populate Database" below to import 50+ historic stamps and configure the platform for launch.
                </AlertDescription>
              </Alert>
            )}

            {isPopulated && (
              <Alert className="bg-green-900/20 border-green-700">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-200">
                  Database is populated. All tabs and features are active and ready to use.
                </AlertDescription>
              </Alert>
            )}

            {seedProgress && (
              <div className="space-y-2">
                <p className="text-sm text-slate-400">{seedProgress}</p>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '45%' }}></div>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-4">
              <Button
                onClick={handleSeedDatabase}
                disabled={isSeeding || isPopulated}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Populating Database...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    {isPopulated ? 'Database Populated' : 'Populate Database'}
                  </>
                )}
              </Button>
              
              {isPopulated && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.info('Database reset feature coming soon')}
                >
                  Reset Database (Coming Soon)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feature Status */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Feature Status</CardTitle>
            <CardDescription>Active tabs and components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Collections Browser', status: 'active', icon: '📚' },
                { name: 'Marketplace Trading', status: 'active', icon: '💳' },
                { name: 'NFT Minting', status: 'active', icon: '🎨' },
                { name: 'Expert Appraisals', status: 'active', icon: '🔍' },
                { name: 'Investor Portal', status: 'active', icon: '📈' },
                { name: 'Partner Network', status: 'active', icon: '🤝' },
                { name: 'Admin Pipeline', status: 'active', icon: '⚙️' },
                { name: 'Economy Dashboard', status: 'active', icon: '💰' },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="font-medium text-white">{feature.name}</span>
                  </div>
                  <Badge className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {feature.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Currency Info */}
        {status?.currency && (
          <Card className="bg-slate-800 border-slate-700 mt-8">
            <CardHeader>
              <CardTitle className="text-white">💰 StampCoin Currency</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Name</p>
                <p className="text-lg font-bold text-white">{status.currency.currencyName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Symbol</p>
                <p className="text-lg font-bold text-white">{status.currency.currencySymbol}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Circulating Supply</p>
                <p className="text-lg font-bold text-white">
                  {parseInt(String(status.currency.circulatingSupply)).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Price (USD)</p>
                <p className="text-lg font-bold text-white">${status.currency.priceUSD}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800 border-slate-700 cursor-pointer hover:border-blue-500 transition">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="font-bold text-white mb-2">NFT Pipeline</h3>
              <p className="text-slate-400 text-sm mb-4">Run NFT generation pipeline</p>
              <Button size="sm" variant="outline" className="w-full">
                Go to Pipeline
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 cursor-pointer hover:border-green-500 transition">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="font-bold text-white mb-2">Collections</h3>
              <p className="text-slate-400 text-sm mb-4">View stamp collections</p>
              <Button size="sm" variant="outline" className="w-full">
                Browse Collections
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 cursor-pointer hover:border-purple-500 transition">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">📈</div>
              <h3 className="font-bold text-white mb-2">Economy</h3>
              <p className="text-slate-400 text-sm mb-4">View currency metrics</p>
              <Button size="sm" variant="outline" className="w-full">
                View Economy
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Documentation */}
        <Card className="bg-slate-800 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">📚 Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
              <span className="text-white font-medium">StampCoin Tokenomics Model</span>
              <Badge>Complete</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
              <span className="text-white font-medium">Partner Outreach Strategy</span>
              <Badge>Complete</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
              <span className="text-white font-medium">Investment Opportunity</span>
              <Badge>Complete</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
