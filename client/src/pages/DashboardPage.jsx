import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CreditCard,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  FilePlus,
  UserPlus,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Card } from '../components/common/Card.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { PrintableReceipt } from '../components/receipt/PrintableReceipt.jsx';

export const DashboardPage = () => {
  const { t, formatETB, formatDate } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleOpenReceipt = async (paymentId) => {
    try {
      const res = await api.get(`/payments/${paymentId}/receipt`);
      if (res.success) {
        setSelectedReceipt(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch receipt:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium">{t('loading')}</p>
      </div>
    );
  }

  // Calculate highest monthly collection for scale
  const maxMonthly = Math.max(...(stats?.monthlyTrends?.map((m) => m.total) || [1000]), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('navDashboard')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Institutional fee summary and real-time transaction ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link to="/students">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <UserPlus className="w-4 h-4 text-slate-500" />
              <span>{t('registerStudent')}</span>
            </Button>
          </Link>
          <Link to="/invoices">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <FilePlus className="w-4 h-4 text-slate-500" />
              <span>{t('createInvoice')}</span>
            </Button>
          </Link>
          <Link to="/payments">
            <Button variant="primary" size="sm" className="gap-1.5">
              <Receipt className="w-4 h-4" />
              <span>{t('recordNewPayment')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Students */}
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('totalStudents')}
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats?.totalStudents || 0}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">Active Enrollments</span>
          </div>
        </Card>

        {/* Collected Today */}
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('feesCollectedToday')}
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {formatETB(stats?.feesCollectedToday || 0)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Total All-Time: <span className="font-semibold text-slate-700">{formatETB(stats?.totalFeesCollected || 0)}</span>
          </div>
        </Card>

        {/* Outstanding Balances */}
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('totalOutstandingFees')}
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">
              {formatETB(stats?.totalOutstandingFees || 0)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-800">
            Pending student fees to collect
          </div>
        </Card>

        {/* Overdue Invoices */}
        <Card className="hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('overdueInvoicesCount')}
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">
              {stats?.overdueCount || 0}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-rose-600 font-semibold">
            Past official due date
          </div>
        </Card>
      </div>

      {/* Monthly Collections Trend & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collections Chart (2 cols) */}
        <div className="lg:col-span-2">
          <Card
            title={t('monthlyCollectionsSummary')}
            subtitle="Collections across all branches (Ethiopian Birr)"
          >
            <div className="h-64 flex items-end gap-3 pt-6 pb-2 px-2">
              {stats?.monthlyTrends?.map((item, idx) => {
                const heightPercent = Math.max(8, Math.round((item.total / maxMonthly) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      {formatETB(item.total)}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all shadow-xs"
                    ></div>
                    <span className="text-xs text-slate-500 font-medium">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Quick Links & Overview (1 col) */}
        <div className="space-y-4">
          <Card title="Fee Collection Policies">
            <ul className="text-xs text-slate-600 space-y-3">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <span>All tuition is denominated in Ethiopian Birr (ETB).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <span>Partial payments are automatically allocated to outstanding line items.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <span>Bank transfer & Telebirr transactions require verification references.</span>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                to="/reports"
                className="text-xs text-emerald-600 font-semibold flex items-center justify-between hover:text-emerald-700"
              >
                <span>View Full Financial Intelligence</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Payments Table */}
      <Card
        title={t('recentPayments')}
        subtitle="Latest verified payment transactions across branches"
        action={
          <Link to="/payments">
            <Button variant="ghost" size="sm" className="text-xs">
              View All
            </Button>
          </Link>
        }
      >
        <div className="overflow-x-auto -mx-5 -my-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                <th className="py-2.5 px-5 font-semibold">{t('receiptNumber')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('date')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('fullName')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('amount')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('paymentMethod')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('cashier')}</th>
                <th className="py-2.5 px-5 font-semibold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentPayments?.length > 0 ? (
                stats.recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {p.student?.firstName} {p.student?.lastName}
                      <span className="text-[10px] text-slate-400 block font-mono">{p.student?.studentIdNumber}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{formatETB(p.amount)}</td>
                    <td className="py-3 px-4 text-slate-600">{p.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-600">{p.cashierName || 'Staff'}</td>
                    <td className="py-3 px-5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenReceipt(p.id)}
                        className="text-xs gap-1 py-1 px-2"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    {t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title="Payment Receipt"
        maxWidth="max-w-2xl"
      >
        <PrintableReceipt payment={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      </Modal>
    </div>
  );
};
