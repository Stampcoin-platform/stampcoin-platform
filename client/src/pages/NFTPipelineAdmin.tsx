import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Play, CheckCircle, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function NFTPipelineAdmin() {
  const [countries, setCountries] = useState<string[]>(['USA', 'GBR', 'FRA']);
  const [years, setYears] = useState<number[]>([new Date().getFullYear()]);
  const [enrichWithCatalogs, setEnrichWithCatalogs] = useState(true);
  const [autoMint, setAutoMint] = useState(false);
  const [blockchain, setBlockchain] = useState<'ethereum' | 'polygon'>('polygon');

  const runPipelineMutation = trpc.archive.runNFTPipeline.useMutation({
    onSuccess: (data) => {
      toast.success('Pipeline Completed', {
        description: `Successfully processed ${data.data.totalProcessed} stamps, imported ${data.data.stampsImported}, minted ${data.data.nftsMinted} NFTs`,
      });
    },
    onError: (error) => {
      toast.error('Pipeline Failed', {
        description: error.message,
      });
    },
  });

  const quickStartMutation = trpc.archive.quickStartPipeline.useMutation({
    onSuccess: (data) => {
      toast.success('Quick Start Completed', {
        description: `Successfully processed ${data.data.totalProcessed} stamps`,
      });
    },
    onError: (error) => {
      toast.error('Quick Start Failed', {
        description: error.message,
      });
    },
  });

  const handleRunPipeline = () => {
    runPipelineMutation.mutate({
      countries,
      years,
      enrichWithCatalogs,
      autoMint,
      blockchain,
    });
  };

  const handleQuickStart = () => {
    quickStartMutation.mutate();
  };

  const availableCountries = [
    'USA', 'GBR', 'FRA', 'DEU', 'CHN', 'JPN', 'IND', 'BRA', 'AUS', 'CAN',
  ];

  const toggleCountry = (country: string) => {
    if (countries.includes(country)) {
      setCountries(countries.filter(c => c !== country));
    } else {
      setCountries([...countries, country]);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">NFT Generation Pipeline</h1>
        <p className="text-muted-foreground">
          Automated pipeline to scrape stamps from Universal Postal Union, enrich with catalog data, and mint NFTs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Configuration</CardTitle>
              <CardDescription>
                Configure the automated NFT generation process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Country Selection */}
              <div>
                <Label className="mb-3 block">Select Countries</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {availableCountries.map((country) => (
                    <Button
                      key={country}
                      variant={countries.includes(country) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleCountry(country)}
                    >
                      {country}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Year Selection */}
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={years[0]}
                  onChange={(e) => setYears([parseInt(e.target.value)])}
                  min="1840"
                  max={new Date().getFullYear()}
                />
              </div>

              {/* Processing Options */}
              <div className="space-y-3">
                <Label>Processing Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="catalogs"
                      checked={enrichWithCatalogs}
                      onCheckedChange={(checked) => setEnrichWithCatalogs(checked as boolean)}
                    />
                    <Label htmlFor="catalogs" className="font-normal cursor-pointer">
                      Enrich with Scott's & Stanley Gibbons catalogs
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mint"
                      checked={autoMint}
                      onCheckedChange={(checked) => setAutoMint(checked as boolean)}
                    />
                    <Label htmlFor="mint" className="font-normal cursor-pointer">
                      Auto-mint NFTs
                    </Label>
                  </div>
                </div>
              </div>

              {/* Blockchain Selection */}
              {autoMint && (
                <div>
                  <Label htmlFor="blockchain">Blockchain Network</Label>
                  <Select value={blockchain} onValueChange={(value: any) => setBlockchain(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="polygon">Polygon (Lower fees)</SelectItem>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleRunPipeline}
                  disabled={runPipelineMutation.isPending || countries.length === 0}
                  className="flex-1"
                >
                  {runPipelineMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Pipeline...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Pipeline
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleQuickStart}
                  disabled={quickStartMutation.isPending}
                  variant="outline"
                >
                  {quickStartMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    'Quick Start'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          {(runPipelineMutation.data || quickStartMutation.data) && (
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Results</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const data = runPipelineMutation.data?.data || quickStartMutation.data?.data;
                  if (!data) return null;

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-3xl font-bold text-blue-600">
                            {data.totalProcessed}
                          </div>
                          <div className="text-sm text-muted-foreground">Processed</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-3xl font-bold text-green-600">
                            {data.stampsImported}
                          </div>
                          <div className="text-sm text-muted-foreground">Imported</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-3xl font-bold text-purple-600">
                            {data.nftsMinted}
                          </div>
                          <div className="text-sm text-muted-foreground">NFTs Minted</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-3xl font-bold text-red-600">
                            {data.errors.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Errors</div>
                        </div>
                      </div>

                      {data.errors.length > 0 && (
                        <div className="space-y-2">
                          <Label>Errors:</Label>
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {data.errors.map((error: any, i: number) => (
                              <div key={i} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                {error.step}: {error.stamp} - {error.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {Object.keys(data.categories).length > 0 && (
                        <div>
                          <Label className="mb-2 block">Categories:</Label>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(data.categories).map(([category, count]) => (
                              <div
                                key={category}
                                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                              >
                                {category}: {count as number}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Scrape UPU</h4>
                  <p className="text-muted-foreground">
                    Download stamp images and metadata from Universal Postal Union website
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Enrich Data</h4>
                  <p className="text-muted-foreground">
                    Cross-reference with Scott's and Stanley Gibbons catalogs for valuations
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Import & Process</h4>
                  <p className="text-muted-foreground">
                    Upload images to S3, check duplicates, analyze with AI
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Mint NFTs</h4>
                  <p className="text-muted-foreground">
                    Create blockchain NFTs with IPFS metadata
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  5
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Organize</h4>
                  <p className="text-muted-foreground">
                    Automatically categorize by country, year, and theme
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              The pipeline processes stamps in batches to avoid rate limiting. Large collections may take several minutes.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
