/**
 * صفحة تتبع الشحن والفواتير
 * Shipping Tracking & Invoice Page
 */

import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { trpc } from '../lib/trpc';

interface ShippingRecord {
  id: number;
  tradeId: number;
  trackingNumber: string;
  shippingCompany: string;
  status: string;
  shippingDate: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  senderName: string;
  recipientName: string;
  recipientAddress: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  tradeId: number;
  total: number;
  status: string;
  issuedDate: string;
  paidDate?: string;
}

export function ShippingTracking() {
  const [activeTab, setActiveTab] = useState<'tracking' | 'invoices'>('tracking');
  const [searchTracking, setSearchTracking] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<ShippingRecord | null>(null);

  // جلب معلومات الشحن
  const shippingQuery = trpc.shipping.getTradeShipments.useQuery({
    tradeId: 1, // سيتم استبداله برقم المعاملة الفعلي
  });

  // جلب الفواتير
  const invoicesQuery = trpc.shipping.getUserInvoices.useQuery({
    userId: 'current-user',
    role: 'seller',
    limit: 20,
  });

  const shipments = shippingQuery.data?.shipments || [];
  const invoices = invoicesQuery.data?.invoices || [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-right">تتبع الشحنات والفواتير</h1>

        {/* علامات التبويب */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'tracking'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600'
            }`}
          >
            تتبع الشحنات
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'invoices'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600'
            }`}
          >
            الفواتير
          </button>
        </div>

        {/* محتوى التبويبات */}
        {activeTab === 'tracking' && (
          <TrackingTab
            shipments={shipments}
            searchTracking={searchTracking}
            onSearchChange={setSearchTracking}
            selectedShipment={selectedShipment}
            onSelectShipment={setSelectedShipment}
            isLoading={shippingQuery.isLoading}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesTab
            invoices={invoices}
            isLoading={invoicesQuery.isLoading}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

interface TrackingTabProps {
  shipments: ShippingRecord[];
  searchTracking: string;
  onSearchChange: (value: string) => void;
  selectedShipment: ShippingRecord | null;
  onSelectShipment: (shipment: ShippingRecord | null) => void;
  isLoading: boolean;
}

function TrackingTab({
  shipments,
  searchTracking,
  onSearchChange,
  selectedShipment,
  onSelectShipment,
  isLoading,
}: TrackingTabProps) {
  const trackingQuery = trpc.shipping.trackShipment.useQuery(
    { trackingNumber: searchTracking },
    { enabled: searchTracking.length > 0 }
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '📦';
      case 'in_transit':
        return '🚚';
      case 'delivered':
        return '✅';
      case 'lost':
        return '❌';
      case 'damaged':
        return '⚠️';
      default:
        return '📍';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'in_transit':
        return 'قيد النقل';
      case 'delivered':
        return 'تم التسليم';
      case 'lost':
        return 'مفقود';
      case 'damaged':
        return 'تالف';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* شريط البحث */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">ابحث عن شحنتك</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={searchTracking}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="أدخل رقم المتابعة..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
            بحث
          </button>
        </div>

        {/* نتائج البحث */}
        {trackingQuery.data && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600">رقم المتابعة</p>
                <p className="font-bold text-lg">{trackingQuery.data.trackingNumber}</p>
              </div>
              <span className="text-3xl">{getStatusIcon(trackingQuery.data.status)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">الحالة</p>
                <p className="font-semibold">{getStatusLabel(trackingQuery.data.status)}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">آخر تحديث</p>
                <p className="font-semibold">
                  {new Date(trackingQuery.data.lastUpdate).toLocaleDateString('ar-SA')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">المرسل من</p>
                <p className="font-semibold">{trackingQuery.data.from.name}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">المرسل إلى</p>
                <p className="font-semibold">{trackingQuery.data.to.name}</p>
              </div>
            </div>

            {trackingQuery.data.estimatedDelivery && (
              <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-600">
                <p className="text-sm text-gray-600">موعد التسليم المتوقع</p>
                <p className="font-bold">
                  {new Date(trackingQuery.data.estimatedDelivery).toLocaleDateString('ar-SA')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* قائمة الشحنات */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">شحناتي</h2>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-gray-500">
            جارٍ تحميل البيانات...
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            لا توجد شحنات حالياً
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {shipments.map((shipment) => (
              <div
                key={shipment.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectShipment(shipment)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{shipment.trackingNumber}</p>
                    <p className="text-gray-500 text-sm mb-2">{shipment.shippingCompany}</p>
                    <p className="text-sm mb-2">
                      <strong>من:</strong> {shipment.senderName}
                    </p>
                    <p className="text-sm">
                      <strong>إلى:</strong> {shipment.recipientName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl">
                      {getStatusIcon(shipment.status)}
                    </span>
                    <p className="font-semibold mt-2">
                      {getStatusLabel(shipment.status)}
                    </p>
                  </div>
                </div>

                {selectedShipment?.id === shipment.id && (
                  <ShippingDetails shipment={shipment} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ShippingDetailsProps {
  shipment: ShippingRecord;
}

function ShippingDetails({ shipment }: ShippingDetailsProps) {
  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600 mb-1">تاريخ الشحن</p>
          <p className="font-semibold">
            {new Date(shipment.shippingDate).toLocaleDateString('ar-SA')}
          </p>
        </div>
        {shipment.estimatedDeliveryDate && (
          <div>
            <p className="text-gray-600 mb-1">التسليم المتوقع</p>
            <p className="font-semibold">
              {new Date(shipment.estimatedDeliveryDate).toLocaleDateString('ar-SA')}
            </p>
          </div>
        )}
        {shipment.actualDeliveryDate && (
          <div>
            <p className="text-gray-600 mb-1">تاريخ التسليم الفعلي</p>
            <p className="font-semibold text-green-600">
              {new Date(shipment.actualDeliveryDate).toLocaleDateString('ar-SA')}
            </p>
          </div>
        )}
      </div>

      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-semibold mb-2">عنوان التسليم</p>
        <p className="text-sm">{shipment.recipientAddress}</p>
      </div>
    </div>
  );
}

interface InvoicesTabProps {
  invoices: Invoice[];
  isLoading: boolean;
}

function InvoicesTab({ invoices, isLoading }: InvoicesTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'issued':
        return 'bg-blue-100 text-blue-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوع';
      case 'issued':
        return 'صادر';
      case 'overdue':
        return 'متأخر';
      case 'cancelled':
        return 'ملغى';
      case 'draft':
        return 'مسودة';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">الفواتير</h2>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-gray-500">
          جارٍ تحميل البيانات...
        </div>
      ) : invoices.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          لا توجد فواتير حالياً
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold">رقم الفاتورة</th>
                <th className="px-6 py-3 text-sm font-semibold">التاريخ</th>
                <th className="px-6 py-3 text-sm font-semibold">المبلغ</th>
                <th className="px-6 py-3 text-sm font-semibold">الحالة</th>
                <th className="px-6 py-3 text-sm font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(invoice.issuedDate).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    ${parseFloat(invoice.total?.toString() || '0').toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <a href="#" className="text-blue-600 hover:underline">
                      تنزيل
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ShippingTracking;
