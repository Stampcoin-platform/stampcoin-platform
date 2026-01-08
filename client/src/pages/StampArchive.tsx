import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCurrency, formatNumber } from '@/lib/format';
import './StampArchive.css';

interface Stamp {
  id: number;
  archiveId: string;
  country: string;
  denomination: string;
  year: number;
  catalog: string;
  condition: 'mint' | 'used' | 'fine' | 'very_fine';
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  description: string;
  imageUrl: string;
  usdValue: number;
  stampCoinValue: number;
  createdAt: Date;
}

interface StampFilter {
  country?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  minYear?: number;
  maxYear?: number;
}

/**
 * Stamp Archive Gallery Component
 * Displays digital stamps from Internet Archive as NFTs
 */
export function StampArchive() {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<StampFilter>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'detail'>('grid');
  const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // tRPC hooks
  const { data: archiveStats } = trpc.archive.getStats.useQuery();
  const { data: stampsList } = trpc.archive.listStamps.useQuery({
    page,
    limit: 20,
    ...filters,
  });
  const { data: searchResults } = trpc.archive.searchStamps.useQuery(
    { query: searchTerm, filters },
    { enabled: Boolean(searchTerm) },
  );
  const mintMutation = trpc.archive.mintNFT.useMutation();

  useEffect(() => {
    if (searchResults?.data && searchTerm) {
      setStamps(searchResults.data);
      return;
    }
    if (stampsList?.data) {
      setStamps(stampsList.data);
    }
  }, [stampsList, searchResults, searchTerm]);

  useEffect(() => {
    if (archiveStats?.data) {
      setStats(archiveStats.data);
    }
  }, [archiveStats]);

  /**
   * Handle stamp search
   */
  const handleSearch = (query: string) => {
    setLoading(true);
    setSearchTerm(query);
    setLoading(false);
  };

  /**
   * Handle NFT minting
   */
  const handleMintNFT = async (stamp: Stamp) => {
    try {
      const result = await mintMutation.mutateAsync({
        stampArchiveId: stamp.archiveId,
      });
      if (result.success) {
        alert(`NFT minted successfully! Serial: ${result.data.serialNumber}`);
        alert(`Earned ${result.data.stampCoins} StampCoins!`);
      }
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Failed to mint NFT');
    }
  };

  /**
   * Get rarity color
   */
  const getRarityColor = (rarity: string) => {
    const colors = {
      common: '#808080',
      uncommon: '#00FF00',
      rare: '#0080FF',
      very_rare: '#FF00FF',
      legendary: '#FFD700',
    };
    return colors[rarity as keyof typeof colors] || '#000000';
  };

  /**
   * Get condition label
   */
  const getConditionLabel = (condition: string) => {
    const labels = {
      mint: 'Mint Condition',
      used: 'Used',
      fine: 'Fine',
      very_fine: 'Very Fine',
    };
    return labels[condition as keyof typeof labels] || condition;
  };

  return (
    <div className="stamp-archive">
      {/* Header */}
      <div className="archive-header">
        <h1>🏛️ Digital Stamp Archive</h1>
        <p>Historic stamps from the Internet Archive, converted to high-resolution NFTs</p>

        {/* Statistics */}
        {stats && (
          <div className="archive-stats">
            <div className="stat-card">
              <div className="stat-label">Total Stamps</div>
              <div className="stat-value">{formatNumber(stats.totalStamps)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total USD Value</div>
              <div className="stat-value">{formatCurrency(stats.totalUSDValue)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">StampCoins in Archive</div>
              <div className="stat-value">{formatNumber(stats.totalStampCoins)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Legendary Stamps</div>
              <div className="stat-value">
                {stats.byRarity?.find((r: any) => r.rarity === 'legendary')?.count || 0}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="archive-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search stamps by country, catalog number..."
            onChange={(e) => handleSearch(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="filter-controls">
          <select
            value={filters.rarity || ''}
            onChange={(e) =>
              setFilters({ ...filters, rarity: (e.target.value || undefined) as Stamp['rarity'] | undefined })
            }
          >
            <option value="">All Rarities</option>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="very_rare">Very Rare</option>
            <option value="legendary">Legendary</option>
          </select>

          <select
            value={filters.country || ''}
            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          >
            <option value="">All Countries</option>
            <option value="Great Britain">Great Britain</option>
            <option value="United States">United States</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Japan">Japan</option>
            <option value="Italy">Italy</option>
          </select>

          <input
            type="number"
            placeholder="Min Year"
            value={filters.minYear || ''}
            onChange={(e) =>
              setFilters({ ...filters, minYear: e.target.value ? parseInt(e.target.value) : undefined })
            }
          />

          <input
            type="number"
            placeholder="Max Year"
            value={filters.maxYear || ''}
            onChange={(e) =>
              setFilters({ ...filters, maxYear: e.target.value ? parseInt(e.target.value) : undefined })
            }
          />
        </div>

        <div className="view-controls">
          <button
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            ⊞
          </button>
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            ≡
          </button>
          <button
            className={viewMode === 'detail' ? 'active' : ''}
            onClick={() => setViewMode('detail')}
            title="Detail View"
          >
            ⊕
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && <div className="loading">Loading stamps...</div>}

      {/* Grid View */}
      {viewMode === 'grid' && !loading && (
        <div className="stamp-grid">
          {stamps.map((stamp) => (
            <div
              key={stamp.id}
              className="stamp-card"
              onClick={() => setSelectedStamp(stamp)}
            >
              <div className="stamp-image">
                <img src={stamp.imageUrl} alt={stamp.catalog} onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-stamp.png';
                }} />
                <div className="stamp-rarity" style={{ backgroundColor: getRarityColor(stamp.rarity) }}>
                  {stamp.rarity.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              <div className="stamp-info">
                <h3>{stamp.country}</h3>
                <p className="catalog">{stamp.catalog}</p>
                <p className="year">{stamp.year}</p>
                <p className="condition">{getConditionLabel(stamp.condition)}</p>

                <div className="stamp-pricing">
                  <div className="price-usd">${stamp.usdValue.toFixed(2)}</div>
                  <div className="price-coin">{stamp.stampCoinValue} STMP</div>
                </div>

                <button
                  className="mint-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMintNFT(stamp);
                  }}
                >
                  🔗 Mint NFT
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && !loading && (
        <div className="stamp-list">
          <table>
            <thead>
              <tr>
                <th>Catalog</th>
                <th>Country</th>
                <th>Year</th>
                <th>Condition</th>
                <th>Rarity</th>
                <th>USD Value</th>
                <th>StampCoins</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stamps.map((stamp) => (
                <tr key={stamp.id} onClick={() => setSelectedStamp(stamp)}>
                  <td>{stamp.catalog}</td>
                  <td>{stamp.country}</td>
                  <td>{stamp.year}</td>
                  <td>{getConditionLabel(stamp.condition)}</td>
                  <td>
                    <span style={{ color: getRarityColor(stamp.rarity), fontWeight: 'bold' }}>
                      {stamp.rarity.replace('_', ' ')}
                    </span>
                  </td>
                  <td>${stamp.usdValue.toFixed(2)}</td>
                  <td>{stamp.stampCoinValue}</td>
                  <td>
                    <button onClick={() => handleMintNFT(stamp)}>Mint</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedStamp && viewMode === 'detail' && (
        <div className="detail-modal" onClick={() => setSelectedStamp(null)}>
          <div className="detail-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedStamp(null)}>×</button>

            <div className="detail-image">
              <img src={selectedStamp.imageUrl} alt={selectedStamp.catalog} />
            </div>

            <div className="detail-info">
              <h2>{selectedStamp.country} - {selectedStamp.catalog}</h2>
              <p className="description">{selectedStamp.description}</p>

              <div className="detail-specs">
                <div className="spec">
                  <label>Year</label>
                  <span>{selectedStamp.year}</span>
                </div>
                <div className="spec">
                  <label>Denomination</label>
                  <span>{selectedStamp.denomination}</span>
                </div>
                <div className="spec">
                  <label>Condition</label>
                  <span>{getConditionLabel(selectedStamp.condition)}</span>
                </div>
                <div className="spec">
                  <label>Rarity</label>
                  <span style={{ color: getRarityColor(selectedStamp.rarity), fontWeight: 'bold' }}>
                    {selectedStamp.rarity.replace('_', ' ')}
                  </span>
                </div>
                <div className="spec">
                  <label>USD Value</label>
                  <span>${selectedStamp.usdValue.toFixed(2)}</span>
                </div>
                <div className="spec">
                  <label>StampCoins</label>
                  <span>{selectedStamp.stampCoinValue}</span>
                </div>
              </div>

              <button className="mint-button large" onClick={() => {
                handleMintNFT(selectedStamp);
                setSelectedStamp(null);
              }}>
                🔗 Mint This NFT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {stampsList?.pagination && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Previous
          </button>
          <span>Page {page} of {stampsList.pagination.pages}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= stampsList.pagination.pages}
          >
            Next →
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && stamps.length === 0 && (
        <div className="empty-state">
          <h3>No stamps found</h3>
          <p>Try adjusting your filters or search criteria</p>
        </div>
      )}
    </div>
  );
}

export default StampArchive;
