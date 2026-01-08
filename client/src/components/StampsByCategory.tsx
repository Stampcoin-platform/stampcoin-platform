import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

export interface StampCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

interface CategorizedStamps {
  [category: string]: any[];
}

export function StampsByCategory() {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Fetch categories
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      return [
        {
          id: 'era-1800s',
          name: '1800s Era',
          displayName: '🏛️ 1800s - The Birth of Stamps',
          description: 'Historic stamps from the birth of the postal system',
        },
        {
          id: 'era-1900s',
          name: '1900s Era',
          displayName: '✨ 1900s - Golden Era',
          description: 'Beautiful stamps from the 20th century',
        },
        {
          id: 'era-modern',
          name: 'Modern Era',
          displayName: '🚀 Modern (1950+)',
          description: 'Contemporary and modern collecting',
        },
        {
          id: 'rarity-legendary',
          name: 'Legendary',
          displayName: '👑 Legendary Stamps',
          description: 'The rarest and most valuable stamps',
        },
        {
          id: 'rarity-rare',
          name: 'Rare',
          displayName: '💎 Rare Stamps',
          description: 'Scarce and valuable collectibles',
        },
        {
          id: 'rarity-uncommon',
          name: 'Uncommon',
          displayName: '⭐ Uncommon Stamps',
          description: 'Less common but desirable stamps',
        },
      ];
    },
  });

  const categories = categoriesQuery.data || [];

  return (
    <div className="w-full">
      {/* Category Navigation */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* All Button */}
          <button
            onClick={() => setActiveCategory('all')}
            className={`p-3 rounded-lg text-center font-semibold transition-all ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📮 All Stamps
          </button>

          {/* Category Buttons */}
          {categories.map((category: StampCategory) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`p-3 rounded-lg text-center text-sm font-semibold transition-all ${
                activeCategory === category.id
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={category.description}
            >
              {category.displayName}
            </button>
          ))}
        </div>
      </div>

      {/* Active Category Info */}
      {activeCategory !== 'all' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-lg font-semibold text-blue-900">
            {categories.find((c: StampCategory) => c.id === activeCategory)?.displayName}
          </div>
          <p className="text-sm text-blue-700 mt-1">
            {categories.find((c: StampCategory) => c.id === activeCategory)?.description}
          </p>
        </div>
      )}

      {/* Stamps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Placeholder for stamps - would be populated from API */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4"
          >
            <div className="w-full h-40 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded flex items-center justify-center mb-3">
              <span className="text-4xl">🪙</span>
            </div>
            <h3 className="font-semibold text-gray-800">Sample Stamp {i}</h3>
            <p className="text-sm text-gray-600 mb-2">Collection Era</p>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-emerald-600">NFT #{1000 + i}</span>
              <button className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700">
                Mint
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Category Statistics */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">50</div>
          <div className="text-sm opacity-90">Total Stamps</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">5</div>
          <div className="text-sm opacity-90">Legendary Stamps</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">28</div>
          <div className="text-sm opacity-90">Countries</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">160</div>
          <div className="text-sm opacity-90">Years Covered</div>
        </div>
      </div>
    </div>
  );
}
