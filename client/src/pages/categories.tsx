import React from 'react';
import { StampsByCategory } from '@/components/StampsByCategory';

export function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">🏛️ Explore Stamps by Category</h1>
          <p className="text-lg opacity-90">
            Discover rare and valuable stamps organized by era, rarity, and country
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <StampsByCategory />
      </div>

      {/* Info Section */}
      <div className="bg-white py-12 px-4 mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-4xl mb-2">🎨</div>
            <h3 className="font-bold text-lg mb-2">Browse by Era</h3>
            <p className="text-gray-600 text-sm">
              Explore stamps from different historical periods, from the 1840s Penny Black to modern collections
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">💎</div>
            <h3 className="font-bold text-lg mb-2">Filter by Rarity</h3>
            <p className="text-gray-600 text-sm">
              Find legendary stamps, rare gems, uncommon pieces, or common collectibles
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">🌍</div>
            <h3 className="font-bold text-lg mb-2">Discover by Country</h3>
            <p className="text-gray-600 text-sm">
              Explore postal history from 28+ countries and build your international collection
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Collecting?</h2>
          <p className="mb-6">
            Connect your wallet and mint your first stamp NFT. All 50 stamps are verified, authenticated, and stored on IPFS.
          </p>
          <button className="px-8 py-3 bg-white text-emerald-600 font-bold rounded-lg hover:bg-opacity-90 transition-all">
            🚀 Start Minting
          </button>
        </div>
      </div>
    </div>
  );
}
