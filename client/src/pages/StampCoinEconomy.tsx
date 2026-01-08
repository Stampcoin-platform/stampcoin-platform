import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { formatCurrency, formatNumber } from '@/lib/format';
import './StampCoinEconomy.css';

interface CurrencyData {
  currencyName: string;
  currencySymbol: string;
  totalSupply: number;
  circulatingSupply: number;
  maxSupply: number | null;
  burnedSupply: number | null;
  priceUSD: number | string | null;
  marketCap: number | string | null;
  volumeUSD: number | string | null;
  totalStampsInArchive: number | null;
  totalNFTsMinted: number | null;
}

interface UserAssets {
  nfts: any[];
  stampCoinBalance: number;
}

interface DistributionData {
  byType: Array<{ type: string; count: number; total: number }>;
  byStatus: Array<{ status: string; count: number; total: number }>;
}

/**
 * StampCoin Economy Dashboard
 * Shows currency metrics, distribution, and user assets
 */
export function StampCoinEconomy() {
  const [currency, setCurrency] = useState<CurrencyData | null>(null);
  const [distribution, setDistribution] = useState<DistributionData | null>(null);
  const [userAssets, setUserAssets] = useState<UserAssets | null>(null);
  const [chart, setChart] = useState<'supply' | 'distribution' | 'value'>('supply');

  // tRPC hooks
  const { data: currencyStats } = trpc.archive.getCurrencyStats.useQuery();
  const { data: distributionStats } = trpc.archive.getCurrencyDistribution.useQuery();
  const { data: assets } = trpc.archive.getUserAssets.useQuery();

  useEffect(() => {
    if (currencyStats?.data) {
      const c = currencyStats.data as any;
      const normalized: CurrencyData = {
        currencyName: c.currencyName,
        currencySymbol: c.currencySymbol,
        totalSupply: Number(c.totalSupply ?? 0),
        circulatingSupply: Number(c.circulatingSupply ?? 0),
        maxSupply: c.maxSupply ?? null,
        burnedSupply: c.burnedSupply ?? null,
        priceUSD: c.priceUSD ?? 0,
        marketCap: c.marketCap ?? null,
        volumeUSD: c.volumeUSD ?? null,
        totalStampsInArchive: c.totalStampsInArchive ?? null,
        totalNFTsMinted: c.totalNFTsMinted ?? null,
      };
      setCurrency(normalized);
    }
  }, [currencyStats]);

  useEffect(() => {
    if (distributionStats?.data) {
      setDistribution(distributionStats.data);
    }
  }, [distributionStats]);

  useEffect(() => {
    if (assets?.data) {
      setUserAssets(assets.data);
    }
  }, [assets]);

  /**
   * Calculate supply percentage
   */
  const getSupplyPercentage = () => {
    if (!currency) return 0;
    if (!currency.maxSupply) return 0;
    return (currency.circulatingSupply / currency.maxSupply) * 100;
  };

  /**
   * Get distribution colors
   */
  const getColor = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    return colors[index % colors.length];
  };

  return (
    <div className="stampcoin-economy">
      {/* Header */}
      <div className="economy-header">
        <h1>💰 StampCoin Economy</h1>
        <p>Digital Currency System for the Stamp NFT Platform</p>
      </div>

      {/* Main Metrics */}
      {currency && (
        <div className="economy-grid">
          {/* Currency Price */}
          <div className="metric-card large">
            <div className="card-header">
              <h3>💵 Current Price</h3>
            </div>
            <div className="card-content">
              <div className="price-display">
                <span className="currency-symbol">STMP</span>
                <span className="price-value">${Number(currency.priceUSD ?? 0).toFixed(4)}</span>
              </div>
              <p className="price-note">1 STMP = $0.10 USD (Pegged)</p>
            </div>
          </div>

          {/* Market Cap */}
          <div className="metric-card">
            <div className="card-header">
              <h3>📈 Market Cap</h3>
            </div>
            <div className="card-content">
              <div className="metric-value">${formatCurrency(Number(currency.marketCap ?? 0))}</div>
              <p className="metric-label">Total Market Value</p>
            </div>
          </div>

          {/* Total Supply */}
          <div className="metric-card">
            <div className="card-header">
              <h3>🪙 Total Supply</h3>
            </div>
            <div className="card-content">
              <div className="metric-value">{formatNumber(currency.totalSupply)}</div>
              <p className="metric-label">STMP Created</p>
            </div>
          </div>

          {/* Circulating Supply */}
          <div className="metric-card">
            <div className="card-header">
              <h3>♻️ Circulating</h3>
            </div>
            <div className="card-content">
              <div className="metric-value">{formatNumber(currency.circulatingSupply)}</div>
              <p className="metric-label">STMP in Circulation</p>
            </div>
          </div>

          {/* Trading Volume */}
          <div className="metric-card">
            <div className="card-header">
              <h3>📊 24h Volume</h3>
            </div>
            <div className="card-content">
              <div className="metric-value">${formatCurrency(Number(currency.volumeUSD ?? 0))}</div>
              <p className="metric-label">Trading Volume</p>
            </div>
          </div>

          {/* NFTs Minted */}
          <div className="metric-card">
            <div className="card-header">
              <h3>🔗 NFTs Minted</h3>
            </div>
            <div className="card-content">
              <div className="metric-value">{formatNumber(Number(currency.totalNFTsMinted ?? 0))}</div>
              <p className="metric-label">Total NFTs Created</p>
            </div>
          </div>
        </div>
      )}

      {/* Supply Progress */}
      {currency && (
        <div className="supply-section">
          <h2>Supply Allocation</h2>
          <div className="supply-bars">
            <div className="supply-bar">
              <label>Circulating Supply</label>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${getSupplyPercentage()}%`,
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                  }}
                >
                  <span className="progress-label">{getSupplyPercentage().toFixed(1)}%</span>
                </div>
              </div>
              <div className="supply-info">
                <span>{formatNumber(currency.circulatingSupply)}</span>
                <span>/ {formatNumber(Number(currency.maxSupply ?? 0))}</span>
              </div>
            </div>

            <div className="supply-breakdown">
              <div className="breakdown-item">
                <div className="breakdown-label">Minted</div>
                <div className="breakdown-value">{formatNumber(currency.totalSupply)}</div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">Burned</div>
                  <div className="breakdown-value">{formatNumber(Number(currency.burnedSupply ?? 0))}</div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">Reserve</div>
                <div className="breakdown-value">
                  {formatNumber(Number(currency.maxSupply ?? 0) - currency.circulatingSupply)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Charts */}
      {distribution && (
        <div className="distribution-section">
          <h2>Currency Distribution</h2>

          <div className="chart-selector">
            <button
              className={chart === 'distribution' ? 'active' : ''}
              onClick={() => setChart('distribution')}
            >
              By Type
            </button>
            <button
              className={chart === 'supply' ? 'active' : ''}
              onClick={() => setChart('supply')}
            >
              By Status
            </button>
          </div>

          {chart === 'distribution' && (
            <div className="distribution-chart">
              <div className="chart-bars">
                {distribution.byType.map((item, index) => (
                  <div key={item.type} className="chart-item">
                    <div className="chart-label">{item.type}</div>
                    <div className="chart-bar-container">
                      <div
                        className="chart-bar"
                        style={{
                          height: `${(item.total / 1000000) * 100}%`,
                          background: getColor(index),
                        }}
                      />
                    </div>
                    <div className="chart-value">
                      <div>{item.count}</div>
                      <div>{formatNumber(item.total)} STMP</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chart === 'supply' && (
            <div className="distribution-chart">
              <div className="chart-bars">
                {distribution.byStatus.map((item, index) => (
                  <div key={item.status} className="chart-item">
                    <div className="chart-label">{item.status}</div>
                    <div className="chart-bar-container">
                      <div
                        className="chart-bar"
                        style={{
                          height: `${(item.total / 1000000) * 100}%`,
                          background: getColor(index),
                        }}
                      />
                    </div>
                    <div className="chart-value">
                      <div>{item.count}</div>
                      <div>{formatNumber(item.total)} STMP</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Assets */}
      {userAssets && (
        <div className="user-assets-section">
          <h2>Your Assets</h2>

          <div className="assets-grid">
            <div className="asset-card">
              <div className="asset-icon">💰</div>
              <div className="asset-info">
                <h3>StampCoin Balance</h3>
                <div className="asset-value">{formatNumber(userAssets.stampCoinBalance)} STMP</div>
                <p className="asset-usd">${(userAssets.stampCoinBalance * 0.1).toFixed(2)} USD</p>
              </div>
            </div>

            <div className="asset-card">
              <div className="asset-icon">🔗</div>
              <div className="asset-info">
                <h3>NFTs Owned</h3>
                <div className="asset-value">{userAssets.nfts.length}</div>
                <p className="asset-usd">Collectible Stamps</p>
              </div>
            </div>
          </div>

          {userAssets.nfts.length > 0 && (
            <div className="nft-list">
              <h3>Your NFT Collection</h3>
              <div className="nft-items">
                {userAssets.nfts.slice(0, 6).map((nft) => (
                  <div key={nft.id} className="nft-item">
                    <div className="nft-serial">{nft.serialNumber}</div>
                    <div className="nft-network">{nft.blockchainNetwork}</div>
                    <div className="nft-date">{new Date(nft.mintedAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
              {userAssets.nfts.length > 6 && (
                <p className="more-items">+ {userAssets.nfts.length - 6} more NFTs</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Economics Info */}
      <div className="economics-info">
        <h2>Economy Model</h2>

        <div className="info-grid">
          <div className="info-card">
            <h3>Pegging Mechanism</h3>
            <p>
              StampCoin is pegged 1:1 to the base value of $0.10 USD. Each stamp NFT minted distributes
              StampCoins equivalent to its appraised value.
            </p>
          </div>

          <div className="info-card">
            <h3>Stamp-to-Coin Ratio</h3>
            <p>
              The total circulating StampCoins directly corresponds to the number and types of stamps in the
              archive. More stamps = more currency in circulation.
            </p>
          </div>

          <div className="info-card">
            <h3>Price Discovery</h3>
            <p>
              Stamp values are calculated based on:
              <ul>
                <li>Original denomination × age multiplier</li>
                <li>Condition multiplier (mint to poor)</li>
                <li>Rarity multiplier (common to legendary)</li>
              </ul>
            </p>
          </div>

          <div className="info-card">
            <h3>Distribution Channels</h3>
            <p>
              StampCoins are distributed through:
              <ul>
                <li>NFT minting from the archive</li>
                <li>Stamp purchases and trades</li>
                <li>Expert verification rewards</li>
                <li>Platform engagement incentives</li>
              </ul>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StampCoinEconomy;
