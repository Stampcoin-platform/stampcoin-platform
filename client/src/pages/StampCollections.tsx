import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Stamp, Globe, Calendar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function StampCollections() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = trpc.archive.getCategories.useQuery();

  // Fetch stamps by category
  const { data: stampsData, isLoading: stampsLoading } = trpc.archive.getStampsByCategory.useQuery(
    {
      category: selectedCountry ? 'country' : selectedYear ? 'year' : selectedRarity ? 'rarity' : 'country',
      value: selectedCountry || selectedYear || selectedRarity || undefined,
    },
    { enabled: !!(selectedCountry || selectedYear || selectedRarity) }
  );

  const countries = categoriesData?.data?.countries || [];
  const years = categoriesData?.data?.years || [];
  const rarities = categoriesData?.data?.rarities || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Stamp Collections</h1>
        <p className="text-muted-foreground">
          Explore our curated collection of stamps from around the world, organized by country, year, and rarity.
        </p>
      </div>

      <Tabs defaultValue="countries" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="countries" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            By Country
          </TabsTrigger>
          <TabsTrigger value="years" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            By Year
          </TabsTrigger>
          <TabsTrigger value="rarity" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            By Rarity
          </TabsTrigger>
        </TabsList>

        {/* Countries Tab */}
        <TabsContent value="countries" className="space-y-6">
          {categoriesLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {countries.map((country: any) => (
                  <Card
                    key={country.category}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedCountry === country.category ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedCountry(country.category)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-4xl mb-2">
                        {getFlagEmoji(country.category)}
                      </div>
                      <p className="font-semibold text-sm">{country.category}</p>
                      <Badge variant="secondary" className="mt-2">
                        {country.count} stamps
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedCountry && stampsData?.data && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {selectedCountry} Stamps ({stampsData.data.length})
                  </h2>
                  <StampGrid stamps={stampsData.data} />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Years Tab */}
        <TabsContent value="years" className="space-y-6">
          {categoriesLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {years.slice().reverse().map((year: any) => (
                  <Card
                    key={year.category}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedYear === String(year.category) ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedYear(String(year.category))}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="font-bold text-lg">{year.category}</p>
                      <Badge variant="secondary" className="mt-2">
                        {year.count}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedYear && stampsData?.data && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {selectedYear} Stamps ({stampsData.data.length})
                  </h2>
                  <StampGrid stamps={stampsData.data} />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Rarity Tab */}
        <TabsContent value="rarity" className="space-y-6">
          {categoriesLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {rarities.map((rarity: any) => (
                  <Card
                    key={rarity.category}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedRarity === rarity.category ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedRarity(rarity.category)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-2">
                        {getRarityIcon(rarity.category)}
                      </div>
                      <p className="font-semibold capitalize">{rarity.category.replace('_', ' ')}</p>
                      <Badge
                        variant="secondary"
                        className={`mt-2 ${getRarityColor(rarity.category)}`}
                      >
                        {rarity.count} stamps
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedRarity && stampsData?.data && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold mb-4 capitalize">
                    {selectedRarity.replace('_', ' ')} Stamps ({stampsData.data.length})
                  </h2>
                  <StampGrid stamps={stampsData.data} />
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StampGrid({ stamps }: { stamps: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {stamps.map((stamp) => (
        <Card key={stamp.id} className="overflow-hidden hover:shadow-xl transition-shadow">
          <div className="aspect-square bg-muted relative">
            {stamp.imageUrl ? (
              <img
                src={stamp.imageUrl}
                alt={stamp.description}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Stamp className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            <Badge className="absolute top-2 right-2 capitalize">
              {stamp.rarity.replace('_', ' ')}
            </Badge>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-1 line-clamp-1">
              {stamp.country} {stamp.year}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {stamp.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {stamp.catalog}
              </span>
              <Badge variant="outline">${stamp.usdValue}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getFlagEmoji(country: string): string {
  const flags: Record<string, string> = {
    'United States': '🇺🇸',
    'USA': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'GBR': '🇬🇧',
    'France': '🇫🇷',
    'FRA': '🇫🇷',
    'Germany': '🇩🇪',
    'DEU': '🇩🇪',
    'China': '🇨🇳',
    'CHN': '🇨🇳',
    'Japan': '🇯🇵',
    'JPN': '🇯🇵',
    'India': '🇮🇳',
    'IND': '🇮🇳',
    'Brazil': '🇧🇷',
    'BRA': '🇧🇷',
    'Australia': '🇦🇺',
    'AUS': '🇦🇺',
    'Canada': '🇨🇦',
    'CAN': '🇨🇦',
  };
  return flags[country] || '🌍';
}

function getRarityIcon(rarity: string): string {
  const icons: Record<string, string> = {
    'common': '⚪',
    'uncommon': '🟢',
    'rare': '🔵',
    'very_rare': '🟣',
    'legendary': '🟡',
  };
  return icons[rarity] || '⚪';
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    'common': 'bg-gray-100 text-gray-800',
    'uncommon': 'bg-green-100 text-green-800',
    'rare': 'bg-blue-100 text-blue-800',
    'very_rare': 'bg-purple-100 text-purple-800',
    'legendary': 'bg-yellow-100 text-yellow-800',
  };
  return colors[rarity] || '';
}
