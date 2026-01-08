/**
 * NFT Downloads Gallery Component
 * Display all minted stamps with download functionality
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Stamp {
  id: string;
  filename: string;
  downloadUrl: string;
  fileSize: number;
  uploadedAt: string;
}

interface MintActivity {
  stampId: string;
  country: string;
  rarity: string;
  tokenId?: string;
  ipfsHash?: string;
  status: 'success' | 'error';
  timestamp: string;
}

export function NFTDownloadsGallery() {
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const stampsQuery = useQuery({
    queryKey: ['downloads.listStamps'],
    queryFn: async () => {
      // Mock data for now - will use actual API when available
      return [];
    },
  });

  const statsQuery = useQuery({
    queryKey: ['downloads.getMintingStats'],
    queryFn: async () => {
      // Mock data for now
      return {};
    },
  });

  const activityQuery = useQuery({
    queryKey: ['downloads.getMintingActivity'],
    queryFn: async () => {
      // Mock data for now
      return { activity: [] };
    },
  });

  // Filter stamps
  const stamps = (stampsQuery.data || []) as Stamp[];
  const filteredStamps = stamps.filter((stamp) => {
    const id = stamp.id.toLowerCase();
    const query = searchQuery.toLowerCase();
    return id.includes(query);
  });

  // Extract unique countries and rarities for filters
  const countries = Array.from(
    new Set(
      (activityQuery.data?.activity || []).map((a: MintActivity) => a.country),
    ),
  ).sort() as string[];

  const rarities = Array.from(
    new Set(
      (activityQuery.data?.activity || []).map((a: MintActivity) => a.rarity),
    ),
  ).sort() as string[];

  const handleDownload = async (stamp: Stamp) => {
    try {
      const response = await fetch(stamp.downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = stamp.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download stamp');
    }
  };

  const stats = statsQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">NFT Stamp Gallery</h1>
              <p className="mt-2 text-sm text-slate-400">
                All minted stamps available for download
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-400">
                {stampsQuery.data?.length || 0}
              </p>
              <p className="text-sm text-slate-400">Total Stamps</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-slate-700/50 p-4 border border-slate-600">
              <p className="text-sm text-slate-400">Total Minted</p>
              <p className="text-2xl font-bold text-emerald-400">
                {(stats as any).totalStamps || 0}
              </p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-4 border border-slate-600">
              <p className="text-sm text-slate-400">Success Rate</p>
              <p className="text-2xl font-bold text-cyan-400">
                {(stats as any).successRate || 0}%
              </p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-4 border border-slate-600">
              <p className="text-sm text-slate-400">Pinata IPFS</p>
              <p className="text-2xl font-bold text-purple-400">
                {(stats as any).ipfsStorage?.pinata || 0}
              </p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-4 border border-slate-600">
              <p className="text-sm text-slate-400">nft.storage</p>
              <p className="text-2xl font-bold text-orange-400">
                {(stats as any).ipfsStorage?.nftStorage || 0}
              </p>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="mb-8 space-y-4 rounded-lg bg-slate-700/30 p-4 border border-slate-600">
          <div>
            <input
              type="text"
              placeholder="Search stamps by ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Buttons */}
          {countries.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-300">
                Countries
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCountry('all')}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    selectedCountry === 'all'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                  }`}
                >
                  All
                </button>
                {countries.map((country: string) => (
                  <button
                    key={country}
                    onClick={() => setSelectedCountry(country as string)}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      selectedCountry === country
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>
          )}

          {rarities.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-300">
                Rarity
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedRarity('all')}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    selectedRarity === 'all'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                  }`}
                >
                  All
                </button>
                {rarities.map((rarity: string) => (
                  <button
                    key={rarity}
                    onClick={() => setSelectedRarity(rarity as string)}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      selectedRarity === rarity
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                    }`}
                  >
                    {rarity}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stamps Grid */}
        {stampsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-400">Loading stamps...</p>
          </div>
        ) : filteredStamps.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-400">No stamps found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredStamps.map((stamp: Stamp) => (
              <div
                key={stamp.id}
                className="group rounded-lg border border-slate-600 bg-slate-700/50 overflow-hidden hover:border-emerald-500 transition-colors"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-slate-600">
                  <img
                    src={stamp.downloadUrl}
                    alt={stamp.id}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-sm font-mono text-slate-300 truncate">
                    {stamp.id}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {(stamp.fileSize / 1024).toFixed(1)} KB
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(stamp.uploadedAt).toLocaleDateString()}
                  </p>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(stamp)}
                    className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Activity */}
        {(activityQuery.data?.activity || []).length > 0 && (
          <div className="mt-12 rounded-lg border border-slate-600 bg-slate-700/30 p-6">
            <h2 className="mb-4 text-xl font-bold">Recent Minting Activity</h2>
            <div className="space-y-2">
              {(activityQuery.data?.activity || []).map((activity: MintActivity, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded bg-slate-700/50 p-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {activity.country} {activity.rarity}
                    </p>
                    <p className="text-xs text-slate-400">
                      {activity.stampId}
                    </p>
                  </div>
                  <div className="text-right">
                    {activity.status === 'success' ? (
                      <span className="inline-block rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
                        ✓ Minted
                      </span>
                    ) : (
                      <span className="inline-block rounded bg-red-500/20 px-2 py-1 text-xs text-red-300">
                        ✗ Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NFTDownloadsGallery;
