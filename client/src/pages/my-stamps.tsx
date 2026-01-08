/**
 * My Stamps Page
 * صفحة طوابعي
 */

import { trpc } from '../lib/trpc';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Coins,
  ExternalLink,
  Package,
} from 'lucide-react';
import { Link } from 'wouter';

export default function MyStampsPage() {
  const { data, isLoading, error } = trpc.stampAuthentication.mySubmissions.useQuery();

  const { data: balanceData } = trpc.stampAuthentication.getEscrowBalance.useQuery();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'minted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending_verification':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_verification: 'في انتظار التحقق',
      verified: 'تم التحقق',
      rejected: 'مرفوض',
      payment_received: 'تم الدفع',
      minting: 'جاري السك',
      minted: 'تم السك',
      failed: 'فشل',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">خطأ في التحميل</h3>
            <p className="text-gray-600">{(error as any)?.message ?? 'حدث خطأ غير متوقع'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">طوابعي</h1>
            <p className="text-gray-600 mt-1">إدارة طوابعك ومتابعة حالة التوثيق</p>
          </div>
          <Link href="/upload">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Upload className="w-4 h-4 mr-2" />
              رفع طابع جديد
            </Button>
          </Link>
        </div>

        {/* Balance Overview */}
        {balanceData && (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm">الرصيد المتاح</p>
                    <p className="text-3xl font-bold mt-1">{balanceData.availableBalance}</p>
                    <p className="text-emerald-100 text-sm">StampCoins</p>
                  </div>
                  <Coins className="w-12 h-12 text-emerald-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">مقفل (ضمان)</p>
                    <p className="text-3xl font-bold mt-1">{balanceData.escrowLocked}</p>
                    <p className="text-orange-100 text-sm">StampCoins</p>
                  </div>
                  <Package className="w-12 h-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">المجموع الكلي</p>
                    <p className="text-3xl font-bold mt-1">{balanceData.totalBalance}</p>
                    <p className="text-blue-100 text-sm">StampCoins</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stamps Grid */}
        {!data || data.submissions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد طوابع بعد</h3>
              <p className="text-gray-500 mb-6">ابدأ برفع أول طابع لك وقم بتوثيقه على البلوكشين</p>
              <Link href="/upload">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Upload className="w-4 h-4 mr-2" />
                  رفع طابع الآن
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.submissions.map((stamp: any) => (
              <Card key={stamp.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{stamp.title}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {stamp.country} • {stamp.year}
                      </p>
                    </div>
                    {getStatusIcon(stamp.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status Badge */}
                  <Badge
                    variant={
                      stamp.status === 'minted'
                        ? 'default'
                        : stamp.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {getStatusLabel(stamp.status)}
                  </Badge>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">الندرة:</span>
                      <span className="font-medium">{stamp.rarity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">القيمة:</span>
                      <span className="font-medium">${stamp.estimated_value}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">تكلفة السك:</span>
                      <span className="font-medium">{stamp.minting_cost_stampcoins} SC</span>
                    </div>
                  </div>

                  {/* Auth Certificate */}
                  {stamp.auth_certificate && (
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <div className="text-gray-600 mb-1">شهادة التوثيق:</div>
                      <code className="text-gray-900 break-all">{stamp.auth_certificate}</code>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {stamp.status === 'verified' && (
                      <Button size="sm" className="flex-1 bg-emerald-600">
                        <Coins className="w-3 h-3 mr-1" />
                        دفع وسك
                      </Button>
                    )}

                    {stamp.status === 'minted' && stamp.ipfs_hash && (
                      <>
                        <Button size="sm" variant="outline" className="flex-1" asChild>
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${stamp.ipfs_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            IPFS
                          </a>
                        </Button>
                        <Button size="sm" className="flex-1 bg-blue-600" asChild>
                          <Link href={`/trade/${stamp.id}`}>
                            <Package className="w-3 h-3 mr-1" />
                            تداول
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    <div>تاريخ الرفع: {new Date(stamp.created_at).toLocaleDateString('ar')}</div>
                    {stamp.verified_at && (
                      <div>
                        تاريخ التحقق: {new Date(stamp.verified_at).toLocaleDateString('ar')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statistics */}
        {data && data.submissions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>الإحصائيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">{data.total}</div>
                  <div className="text-sm text-gray-600 mt-1">إجمالي الطوابع</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {data.submissions.filter((s: any) => s.status === 'minted').length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">تم سكها</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {data.submissions.filter((s: any) => s.status === 'pending_verification').length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">في الانتظار</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    $
                    {data.submissions
                      .reduce((sum: number, s: any) => sum + parseFloat(s.estimated_value), 0)
                      .toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">القيمة الإجمالية</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
