/**
 * Physical Trade Component
 * مكون تداول الطوابع الحقيقية
 */

import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Package,
  Truck,
  Shield,
  DollarSign,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Star,
} from 'lucide-react';

interface PhysicalTradeProps {
  stampId: number;
  stampTitle: string;
  stampValue: number;
  sellerId: number;
}

type ShippingCompany = 'DHL' | 'FedEx' | 'UPS' | 'USPS' | 'Aramex';
type TradeData = {
  agreedPrice: number;
  shippingCompany: ShippingCompany;
  insuranceAmount: number;
  buyerAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  sellerAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
};

export function PhysicalTrade({ stampId, stampTitle, stampValue, sellerId }: PhysicalTradeProps) {
  const [step, setStep] = useState(1); // 1: Details, 2: Escrow, 3: Shipping, 4: Confirm

  const [tradeData, setTradeData] = useState<TradeData>({
    agreedPrice: stampValue,
    shippingCompany: 'DHL' as ShippingCompany,
    insuranceAmount: stampValue,
    buyerAddress: {
      fullName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      phone: '',
    },
    sellerAddress: {
      fullName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      phone: '',
    },
  });

  // Get escrow balance
  const { data: balanceData } = trpc.stampAuthentication.getEscrowBalance.useQuery();

  // Get active trades
  const { data: tradesData, refetch: refetchTrades } = trpc.stampAuthentication.myTrades.useQuery();

  // Initiate trade mutation
  const initiateTradeMutation = trpc.stampAuthentication.initiatePhysicalTrade.useMutation({
    onSuccess: (data) => {
      alert('تم إنشاء عملية التداول بنجاح!\nرقم العملية: ' + data.tradeId);
      refetchTrades();
    },
  });

  // Update shipping mutation
  const [trackingData, setTrackingData] = useState({
    tradeId: '',
    trackingNumber: '',
    shippingReceipt: '',
    packagePhotos: [] as string[],
  });

  const updateShippingMutation = trpc.stampAuthentication.updateShippingTracking.useMutation({
    onSuccess: () => {
      alert('تم تحديث معلومات الشحن بنجاح!');
      refetchTrades();
    },
  });

  // Confirm receipt mutation
  const [confirmData, setConfirmData] = useState({
    tradeId: '',
    conditionMatch: true,
    receiptPhotos: [] as string[],
    rating: 5,
    feedback: '',
  });

  const confirmReceiptMutation = trpc.stampAuthentication.confirmReceipt.useMutation({
    onSuccess: (data) => {
      alert('تم إتمام العملية بنجاح!\n' + data.message);
      refetchTrades();
    },
  });

  const shippingCostEstimate = 50; // $50 USD
  const escrowCalculation = {
    buyerDeposit: tradeData.agreedPrice + shippingCostEstimate + tradeData.agreedPrice * 0.1,
    sellerDeposit: tradeData.agreedPrice * 0.2,
    platformFee: tradeData.agreedPrice * 0.05,
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Package className="w-6 h-6" />
            تداول الطابع الحقيقي
          </CardTitle>
          <p className="text-blue-100 mt-2">{stampTitle}</p>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Sidebar: Balance & Steps */}
        <div className="space-y-4">
          {/* Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">رصيدك</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">متاح:</span>
                <span className="font-bold">{balanceData?.availableBalance || 0} SC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">مقفل (ضمان):</span>
                <span className="font-bold text-orange-600">
                  {balanceData?.escrowLocked || 0} SC
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-gray-600">المجموع:</span>
                <span className="font-bold text-emerald-600">
                  {balanceData?.totalBalance || 0} SC
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">خطوات التداول</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { num: 1, title: 'الاتفاق على السعر', icon: DollarSign },
                  { num: 2, title: 'إيداع الضمان', icon: Shield },
                  { num: 3, title: 'الشحن', icon: Truck },
                  { num: 4, title: 'التأكيد والإتمام', icon: CheckCircle2 },
                ].map((s) => (
                  <div
                    key={s.num}
                    className={`flex items-center gap-3 p-2 rounded ${
                      step === s.num ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step >= s.num
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {step > s.num ? '✓' : s.num}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Agreement */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>1. تفاصيل الصفقة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">السعر المتفق عليه (USD)</label>
                  <Input
                    type="number"
                    value={tradeData.agreedPrice}
                    onChange={(e) =>
                      setTradeData({ ...tradeData, agreedPrice: parseFloat(e.target.value) })
                    }
                    min={0}
                  />
                  <p className="text-xs text-gray-500 mt-1">القيمة المقدرة: ${stampValue}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">شركة الشحن</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={tradeData.shippingCompany}
                    onChange={(e) =>
                      setTradeData({
                        ...tradeData,
                        shippingCompany: e.target.value as ShippingCompany,
                      })
                    }
                  >
                    <option value="DHL">DHL Express</option>
                    <option value="FedEx">FedEx International</option>
                    <option value="UPS">UPS Worldwide</option>
                    <option value="USPS">USPS</option>
                    <option value="Aramex">Aramex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">قيمة التأمين (USD)</label>
                  <Input
                    type="number"
                    value={tradeData.insuranceAmount}
                    onChange={(e) =>
                      setTradeData({ ...tradeData, insuranceAmount: parseFloat(e.target.value) })
                    }
                    min={0}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    يُنصح بتأمين بقيمة الطابع أو أكثر
                  </p>
                </div>

                <Alert>
                  <DollarSign className="w-4 h-4" />
                  <AlertDescription>
                    <div className="text-sm space-y-1">
                      <div className="font-semibold mb-2">حساب الضمان:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <span>إيداع المشتري:</span>
                        <span className="font-bold">
                          ${escrowCalculation.buyerDeposit.toFixed(2)}
                        </span>
                        <span>إيداع البائع:</span>
                        <span className="font-bold">
                          ${escrowCalculation.sellerDeposit.toFixed(2)}
                        </span>
                        <span>أتعاب المنصة (5%):</span>
                        <span className="font-bold">${escrowCalculation.platformFee.toFixed(2)}</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <Button onClick={() => setStep(2)} className="w-full bg-emerald-600">
                  التالي: إدخال العناوين
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Addresses & Escrow */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>2. العناوين وإيداع الضمان</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Buyer Address */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    عنوان المشتري
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="الاسم الكامل"
                      value={tradeData.buyerAddress.fullName}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          buyerAddress: { ...tradeData.buyerAddress, fullName: e.target.value },
                        })
                      }
                    />
                    <Input
                      placeholder="رقم الهاتف"
                      value={tradeData.buyerAddress.phone}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          buyerAddress: { ...tradeData.buyerAddress, phone: e.target.value },
                        })
                      }
                    />
                    <Input
                      className="col-span-2"
                      placeholder="الشارع والعنوان"
                      value={tradeData.buyerAddress.street}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          buyerAddress: { ...tradeData.buyerAddress, street: e.target.value },
                        })
                      }
                    />
                    <Input
                      placeholder="المدينة"
                      value={tradeData.buyerAddress.city}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          buyerAddress: { ...tradeData.buyerAddress, city: e.target.value },
                        })
                      }
                    />
                    <Input
                      placeholder="الولاية/المحافظة"
                      value={tradeData.buyerAddress.state}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          buyerAddress: { ...tradeData.buyerAddress, state: e.target.value },
                        })
                      }
                    />
                    <Input
                      placeholder="الرمز البريدي"
                      value={tradeData.buyerAddress.zipCode}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          buyerAddress: { ...tradeData.buyerAddress, zipCode: e.target.value },
                        })
                      }
                    />
                    <Input
                      placeholder="الدولة"
                      value={tradeData.buyerAddress.country}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          buyerAddress: { ...tradeData.buyerAddress, country: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Seller Address */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    عنوان البائع
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="الاسم الكامل"
                      value={tradeData.sellerAddress.fullName}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          sellerAddress: { ...tradeData.sellerAddress, fullName: e.target.value },
                        })
                      }
                    />
                    <Input
                      placeholder="رقم الهاتف"
                      value={tradeData.sellerAddress.phone}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          sellerAddress: { ...tradeData.sellerAddress, phone: e.target.value },
                        })
                      }
                    />
                    <Input
                      className="col-span-2"
                      placeholder="الشارع والعنوان"
                      value={tradeData.sellerAddress.street}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          sellerAddress: { ...tradeData.sellerAddress, street: e.target.value },
                        })
                      }
                    />
                    <Input
                      placeholder="المدينة"
                      value={tradeData.sellerAddress.city}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          sellerAddress: { ...tradeData.sellerAddress, city: e.target.value },
                        })
                      }
                    />
                    <Input
                      placeholder="الولاية/المحافظة"
                      value={tradeData.sellerAddress.state}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          sellerAddress: { ...tradeData.sellerAddress, state: e.target.value },
                        })
                      }
                    />
                    <Input
                      placeholder="الرمز البريدي"
                      value={tradeData.sellerAddress.zipCode}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          sellerAddress: { ...tradeData.sellerAddress, zipCode: e.target.value },
                        })
                      }
                    />
                    <Input
                      placeholder="الدولة"
                      value={tradeData.sellerAddress.country}
                      onChange={(e) =>
                        setTradeData({
                          ...tradeData,
                          sellerAddress: { ...tradeData.sellerAddress, country: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <Alert className="bg-orange-50 border-orange-200">
                  <Shield className="w-4 h-4" />
                  <AlertDescription>
                    <div className="font-semibold text-orange-900 mb-2">نظام الضمان</div>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>سيتم قفل الأموال في حساب ضمان آمن</li>
                      <li>لن تُطلق الأموال إلا بعد تأكيد الاستلام</li>
                      <li>حماية كاملة للطرفين</li>
                      <li>حل النزاعات من قبل فريقنا</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    السابق
                  </Button>
                  <Button
                    onClick={() => initiateTradeMutation.mutate({
                      stampId,
                      ...tradeData,
                    })}
                    disabled={initiateTradeMutation.isPending}
                    className="flex-1 bg-emerald-600"
                  >
                    {initiateTradeMutation.isPending
                      ? 'جاري الإنشاء...'
                      : 'إنشاء العملية وإيداع الضمان'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Trades List */}
          {tradesData && tradesData.trades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>عملياتك النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tradesData.trades.map((trade: any) => (
                    <div key={trade.trade_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold">{trade.stamp_title}</div>
                          <div className="text-sm text-gray-600">#{trade.trade_id}</div>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            trade.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : trade.status === 'disputed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {trade.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">السعر:</span> ${trade.agreed_price}
                        </div>
                        <div>
                          <span className="text-gray-600">الشحن:</span> {trade.shipping_company}
                        </div>
                        {trade.tracking_number && (
                          <div className="col-span-2">
                            <span className="text-gray-600">رقم التتبع:</span>{' '}
                            <code className="bg-gray-100 px-2 py-1 rounded">
                              {trade.tracking_number}
                            </code>
                          </div>
                        )}
                      </div>

                      {trade.status === 'escrow_locked' && (
                        <Button size="sm" className="mt-3 w-full" variant="outline">
                          تحديث معلومات الشحن
                        </Button>
                      )}

                      {trade.status === 'delivered' && (
                        <Button size="sm" className="mt-3 w-full bg-emerald-600">
                          تأكيد الاستلام
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
