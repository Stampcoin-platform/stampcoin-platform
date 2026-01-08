/**
 * صفحة إدارة الرصيد الاحتياطي والعمليات المالية
 * Escrow & Balance Management Page
 */

import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { trpc } from '../lib/trpc';

interface Trade {
  id: number;
  stampId: number;
  buyerId: string;
  sellerId: string;
  totalAmount: number;
  tradeStatus: string;
  paymentStatus: string;
  createdAt: string;
}

interface Transaction {
  id: number;
  userId: string;
  transactionType: string;
  amount: number;
  description: string;
  createdAt: string;
  status: string;
}

export function EscrowManagement() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'trades'>('overview');
  const userId = 'current-user'; // سيتم استبداله برقم المستخدم الفعلي

  // جلب رصيد المستخدم الاحتياطي
  const balanceQuery = trpc.trading.getReserveBalance.useQuery({
    userId,
  });

  // جلب سجل المعاملات
  const transactionsQuery = trpc.trading.getTransactionHistory.useQuery({
    userId,
    limit: 20,
  });

  // جلب معاملات المستخدم
  const tradesQuery = trpc.trading.getUserTrades.useQuery({
    userId,
    role: 'both',
  });

  const balance = balanceQuery.data;
  const transactions = transactionsQuery.data?.transactions || [];
  const trades = tradesQuery.data?.trades || [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-right">إدارة الرصيد والعمليات المالية</h1>

        {/* ملخص الرصيد */}
        {balance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <BalanceCard
              title="الرصيد الإجمالي"
              amount={parseFloat(balance.totalBalance?.toString() || '0')}
              color="blue"
              currency="STAMP_COIN"
            />
            <BalanceCard
              title="الرصيد المتاح"
              amount={parseFloat(balance.availableBalance?.toString() || '0')}
              color="green"
              currency="STAMP_COIN"
            />
            <BalanceCard
              title="الأموال المحتفظ بها احتياطياً"
              amount={parseFloat(balance.heldInEscrow?.toString() || '0')}
              color="orange"
              currency="STAMP_COIN"
            />
          </div>
        )}

        {/* علامات تبويب */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600'
            }`}
          >
            نظرة عامة
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'transactions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600'
            }`}
          >
            السجل المالي
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'trades'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600'
            }`}
          >
            المعاملات
          </button>
        </div>

        {/* محتوى التبويبات */}
        {activeTab === 'overview' && (
          <OverviewTab balance={balance} recentTransactions={transactions.slice(0, 5)} />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab transactions={transactions} isLoading={transactionsQuery.isLoading} />
        )}

        {activeTab === 'trades' && (
          <TradesTab trades={trades} isLoading={tradesQuery.isLoading} />
        )}
      </div>
    </DashboardLayout>
  );
}

interface BalanceCardProps {
  title: string;
  amount: number;
  color: 'blue' | 'green' | 'orange';
  currency: string;
}

function BalanceCard({ title, amount, color, currency }: BalanceCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
  };

  return (
    <div className={`border rounded-lg p-6 ${colorClasses[color]}`}>
      <p className="text-gray-600 mb-2">{title}</p>
      <p className="text-3xl font-bold mb-1">{amount.toFixed(2)}</p>
      <p className="text-sm text-gray-500">{currency}</p>
    </div>
  );
}

interface OverviewTabProps {
  balance: any;
  recentTransactions: Transaction[];
}

function OverviewTab({ balance, recentTransactions }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* معلومات الرصيد التفصيلية */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">تفاصيل الرصيد</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b">
            <span className="text-gray-600">الرصيد الإجمالي</span>
            <span className="font-bold text-lg">
              {parseFloat(balance?.totalBalance?.toString() || '0').toFixed(2)} STAMP_COIN
            </span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b">
            <span className="text-gray-600">الرصيد المتاح</span>
            <span className="font-bold text-lg text-green-600">
              {parseFloat(balance?.availableBalance?.toString() || '0').toFixed(2)} STAMP_COIN
            </span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b">
            <span className="text-gray-600">الأموال المحتفظ بها احتياطياً</span>
            <span className="font-bold text-lg text-orange-600">
              {parseFloat(balance?.heldInEscrow?.toString() || '0').toFixed(2)} STAMP_COIN
            </span>
          </div>
          <div className="flex justify-between items-center pt-4 bg-blue-50 p-3 rounded-lg">
            <span className="text-gray-700 font-semibold">النسبة المئوية للأموال المحتفظ بها</span>
            <span className="font-bold text-lg">
              {balance && (parseFloat(balance.heldInEscrow?.toString() || '0') / parseFloat(balance.totalBalance?.toString() || '1') * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* معلومات مفيدة */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold mb-4">معلومات مهمة</h3>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">✓</span>
            <span>يتم حفظ الأموال احتياطياً طول فترة المعاملة</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">✓</span>
            <span>سيتم إفراج الأموال عند اكتمال التسليم</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">✓</span>
            <span>يمكنك سحب الأموال المتاحة في أي وقت</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

interface TransactionsTabProps {
  transactions: Transaction[];
  isLoading: boolean;
}

function TransactionsTab({ transactions, isLoading }: TransactionsTabProps) {
  const getTransactionColor = (type: string) => {
    if (type.includes('deposit') || type.includes('release')) return 'text-green-600';
    if (type.includes('withdrawal') || type.includes('hold')) return 'text-orange-600';
    if (type.includes('fee')) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTransactionIcon = (type: string) => {
    if (type.includes('deposit') || type.includes('release')) return '↓';
    if (type.includes('withdrawal') || type.includes('hold')) return '↑';
    return '●';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">السجل المالي</h2>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-gray-500">
          جارٍ تحميل البيانات...
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          لا توجد معاملات حالياً
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold">التاريخ</th>
                <th className="px-6 py-3 text-sm font-semibold">النوع</th>
                <th className="px-6 py-3 text-sm font-semibold">الوصف</th>
                <th className="px-6 py-3 text-sm font-semibold">المبلغ</th>
                <th className="px-6 py-3 text-sm font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(tx.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${getTransactionColor(tx.transactionType)}`}>
                      {getTransactionIcon(tx.transactionType)} {tx.transactionType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{tx.description}</td>
                  <td className="px-6 py-4 font-bold">
                    {parseFloat(tx.amount?.toString() || '0').toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      tx.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {tx.status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}
                    </span>
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

interface TradesTabProps {
  trades: Trade[];
  isLoading: boolean;
}

function TradesTab({ trades, isLoading }: TradesTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'disputed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">المعاملات</h2>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-gray-500">
          جارٍ تحميل البيانات...
        </div>
      ) : trades.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          لا توجد معاملات حالياً
        </div>
      ) : (
        <div className="space-y-4 p-6">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-lg">معاملة #{trade.id}</p>
                  <p className="text-gray-500 text-sm">
                    {new Date(trade.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(trade.tradeStatus)}`}>
                  {trade.tradeStatus === 'completed' ? 'مكتملة' :
                   trade.tradeStatus === 'shipped' ? 'مشحونة' :
                   trade.tradeStatus === 'disputed' ? 'نزاع' :
                   'قيد الانتظار'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">المبلغ الإجمالي</p>
                  <p className="font-bold text-lg">{trade.totalAmount}</p>
                </div>
                <div>
                  <p className="text-gray-600">حالة الدفع</p>
                  <p className="font-bold">
                    {trade.paymentStatus === 'completed' ? 'مدفوع ✓' : 'قيد الانتظار'}
                  </p>
                </div>
              </div>

              <button className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold">
                عرض التفاصيل
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EscrowManagement;
