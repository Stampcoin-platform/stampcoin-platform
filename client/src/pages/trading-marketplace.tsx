/**
 * صفحة سوق التداول والمعاملات
 * Trading Marketplace Page
 */

import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { trpc } from '../lib/trpc';

interface Listing {
  id: number;
  stampId: number;
  listingType: 'nft_only' | 'physical_only' | 'both';
  nftPrice?: number;
  physicalPrice?: number;
  description?: string;
  status: string;
}

export function TradingMarketplace() {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'nft_only' | 'physical_only' | 'both'>('all');

  // جلب القوائم النشطة
  const listingsQuery = trpc.trading.getListings.useQuery({
    limit: 20,
  });

  // معاملة إنشاء تداول جديد
  const createTradeMutation = trpc.trading.acceptTrade.useMutation({
    onSuccess: (data) => {
      alert(`تم إنشاء المعاملة بنجاح! معرف المعاملة: ${data.tradeId}`);
      setShowTradeForm(false);
      listingsQuery.refetch();
    },
    onError: (error) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  const handleTrade = (listing: Listing) => {
    setSelectedListing(listing);
    setShowTradeForm(true);
  };

  const filteredListings = listingsQuery.data?.listings?.filter((listing: Listing) => {
    if (filter === 'all') return true;
    return listing.listingType === filter;
  }) || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-right">سوق تداول الطوابع</h1>

        {/* عوامل التصفية */}
        <div className="mb-8 flex gap-4 justify-end">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilter('nft_only')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              filter === 'nft_only'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            NFT فقط
          </button>
          <button
            onClick={() => setFilter('physical_only')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              filter === 'physical_only'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            طابع مادي فقط
          </button>
          <button
            onClick={() => setFilter('both')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              filter === 'both'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            الاثنان معاً
          </button>
        </div>

        {/* قائمة القوائم */}
        {listingsQuery.isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">جارٍ تحميل القوائم...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">لا توجد قوائم متاحة في الوقت الحالي</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing: Listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
                  <h3 className="font-bold text-lg mb-2">
                    {listing.listingType === 'both'
                      ? 'NFT + طابع مادي'
                      : listing.listingType === 'nft_only'
                      ? 'NFT فقط'
                      : 'طابع مادي فقط'}
                  </h3>
                </div>

                <div className="p-6">
                  {/* الأسعار */}
                  {listing.nftPrice && (
                    <div className="mb-4 pb-4 border-b">
                      <p className="text-gray-600 mb-2">سعر NFT</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${listing.nftPrice}
                      </p>
                    </div>
                  )}

                  {listing.physicalPrice && (
                    <div className="mb-4 pb-4 border-b">
                      <p className="text-gray-600 mb-2">سعر الطابع المادي</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${listing.physicalPrice}
                      </p>
                    </div>
                  )}

                  {/* الوصف */}
                  {listing.description && (
                    <p className="text-gray-600 text-sm mb-4">{listing.description}</p>
                  )}

                  {/* زر التداول */}
                  <button
                    onClick={() => handleTrade(listing)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                  >
                    عرض تداول
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* نموذج التداول */}
        {showTradeForm && selectedListing && (
          <TradeForm
            listing={selectedListing}
            onClose={() => setShowTradeForm(false)}
            onSubmit={(data) => createTradeMutation.mutate(data)}
            isLoading={createTradeMutation.isPending}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

interface TradeFormProps {
  listing: Listing;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function TradeForm({ listing, onClose, onSubmit, isLoading }: TradeFormProps) {
  const [formData, setFormData] = useState({
    buyNft: listing.listingType !== 'physical_only',
    buyPhysical: listing.listingType !== 'nft_only',
    fullName: '',
    street: '',
    city: '',
    zipCode: '',
    country: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      listingId: listing.id,
      stampId: listing.stampId,
      buyerId: 'current-user', // سيتم استبداله برقم المستخدم الفعلي
      buyNft: formData.buyNft,
      buyPhysical: formData.buyPhysical,
      buyerAddress: {
        fullName: formData.fullName,
        street: formData.street,
        city: formData.city,
        zipCode: formData.zipCode,
        country: formData.country,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-100 p-4 flex justify-between items-center border-b">
          <h2 className="text-xl font-bold">إنشاء تداول جديد</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* خيارات الشراء */}
          {listing.listingType === 'both' && (
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.buyNft}
                  onChange={(e) =>
                    setFormData({ ...formData, buyNft: e.target.checked })
                  }
                  className="mr-2"
                />
                <span>شراء NFT (${listing.nftPrice})</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.buyPhysical}
                  onChange={(e) =>
                    setFormData({ ...formData, buyPhysical: e.target.checked })
                  }
                  className="mr-2"
                />
                <span>شراء الطابع المادي (${listing.physicalPrice})</span>
              </label>
            </div>
          )}

          {/* بيانات العنوان */}
          {formData.buyPhysical && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-bold">عنوان التسليم</h3>

              <input
                type="text"
                placeholder="الاسم الكامل"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />

              <input
                type="text"
                placeholder="الشارع"
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="المدينة"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="الرمز البريدي"
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <input
                type="text"
                placeholder="الدولة"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          )}

          {/* زر الإرسال */}
          <div className="border-t pt-4 space-y-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'جارٍ المعالجة...' : 'تأكيد التداول'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-400"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TradingMarketplace;
