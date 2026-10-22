import React, { useState, useEffect } from 'react';
import { Download, Calendar, BarChart, DollarSign, Users, CheckCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Card } from '../components/common/Card.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';

export const ReportsPage = () => {
  const { t, formatETB, formatDate } = useLanguage();

  const [activeReport, setActiveReport] = useState('daily'); // 'daily', 'monthly', 'outstanding', 'cashier'
  const [loading, setLoading] = useState(false);

  // Daily report state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState(null);

  // Monthly report state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState(null);

  // Outstanding report state
  const [outstandingData, setOutstandingData] = useState(null);

  // Cashier report state
  const [cashierData, setCashierData] = useState([]);

  // Fetch active report data
  const loadReport = async () => {
    setLoading(true);
    try {
      if (activeReport === 'daily') {
        const res = await api.get('/reports/daily', { date: selectedDate });
        if (res.success) setDailyData(res.data);
      } else if (activeReport === 'monthly') {
        const res = await api.get('/reports/monthly', { year: selectedYear });
        if (res.success) setMonthlyData(res.data);
      } else if (activeReport === 'outstanding') {
        const res = await api.get('/reports/outstanding');
        if (res.success) setOutstandingData(res.data);
      } else if (activeReport === 'cashier') {
        const res = await api.get('/reports/cashier');
        if (res.success) setCashierData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReport, selectedDate, selectedYear]);

  const handleExportCsv = async (type) => {
    try {
      const csvText = await api.get('/reports/export-csv', { type });
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `smart_school_${type}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('reportsTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit-ready collection statistics, outstanding student balances, and cashier reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExportCsv(activeReport === 'outstanding' ? 'outstanding' : 'payments')}
            className="gap-2 shrink-0 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{t('downloadCsv')}</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4 text-xs font-semibold">
        {[
          { key: 'daily', label: t('dailyCollections') },
          { key: 'monthly', label: t('monthlyCollections') },
          { key: 'outstanding', label: t('outstandingDebts') },
          { key: 'cashier', label: t('cashierReconciliation') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveReport(tab.key)}
            className={`pb-3 px-1 border-b-2 font-bold transition-colors ${
              activeReport === tab.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report 1: Daily */}
      {activeReport === 'daily' && (
        <div className="space-y-4">
          <Card className="p-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">{t('selectDate')}:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="py-1.5 px-3 text-xs border border-slate-300 rounded-md font-medium"
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Collected</span>
              <span className="text-2xl font-extrabold text-emerald-700 block mt-2">
                {formatETB(dailyData?.totalAmount || 0)}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {dailyData?.totalTransactions || 0} Transactions Recorded
              </span>
            </Card>

            <Card title="By Payment Method" className="sm:col-span-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {dailyData?.byMethod &&
                  Object.entries(dailyData.byMethod).map(([m, amt]) => (
                    <div key={m} className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">{m}</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">{formatETB(amt)}</span>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          <Card title="Transactions List (Today)" className="p-0 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-5">Receipt #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Cashier</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyData?.payments?.length > 0 ? (
                  dailyData.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-5 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {p.student?.firstName} {p.student?.lastName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.paymentMethod}</td>
                      <td className="py-3 px-4 text-slate-600">{p.cashier?.fullName}</td>
                      <td className="py-3 px-5 text-right font-bold text-emerald-700">{formatETB(p.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      No payments recorded on {selectedDate}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Report 2: Monthly */}
      {activeReport === 'monthly' && (
        <div className="space-y-4">
          <Card className="p-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">{t('selectYear')}:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="py-1.5 px-3 text-xs border border-slate-300 rounded-md bg-white font-medium"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </Card>

          <Card title={`Annual Total Revenue (${selectedYear})`}>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {formatETB(monthlyData?.totalYearAmount || 0)}
              </span>
              <span className="text-xs text-slate-500">Collected in Ethiopian Birr</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-6">
              {monthlyData?.monthlyBreakdown?.map((m) => (
                <div key={m.monthIndex} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-xs font-bold text-slate-500 uppercase">{m.monthName}</span>
                  <span className="text-base font-extrabold text-emerald-700 block mt-1">
                    {formatETB(m.total)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {m.count} payments
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Report 3: Outstanding Debts */}
      {activeReport === 'outstanding' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Uncollected School Balances
              </span>
              <span className="text-2xl font-black text-rose-600 block mt-2">
                {formatETB(outstandingData?.totalOutstanding || 0)}
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                Across {outstandingData?.totalInvoices || 0} student invoices
              </span>
            </Card>
          </div>

          <Card title="Outstanding Debt Ledger" className="p-0 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-5">Invoice #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Grade & Section</th>
                  <th className="py-3 px-4">Guardian Phone</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outstandingData?.records?.length > 0 ? (
                  outstandingData.records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{r.invoiceNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {r.studentName}
                        <span className="block text-[10px] text-slate-400 font-mono">{r.studentIdNumber}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{r.gradeName} - {r.sectionName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{r.guardianPhone}</td>
                      <td className="py-3.5 px-4 text-slate-600">{formatDate(r.dueDate)}</td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">{formatETB(r.totalAmount)}</td>
                      <td className="py-3.5 px-4 text-emerald-700 font-semibold">{formatETB(r.paidAmount)}</td>
                      <td className="py-3.5 px-4 text-rose-600 font-extrabold">{formatETB(r.balanceAmount)}</td>
                      <td className="py-3.5 px-5 text-right">
                        <Badge>{r.status}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400">
                      No outstanding debts found!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Report 4: Cashier Performance */}
      {activeReport === 'cashier' && (
        <Card title="Cashier Daily & Historical Collection Reconciliation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cashierData.map((c) => (
              <div key={c.cashierId} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{c.cashierName}</h4>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {c.transactionCount} Receipts Issued
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-xs text-slate-500">Total Money Collected:</span>
                  <span className="text-lg font-black text-slate-900">{formatETB(c.totalCollected)}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  {Object.entries(c.byMethod || {}).map(([method, amt]) => (
                    <div key={method} className="bg-white p-1.5 rounded border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">{method}</span>
                      <span className="font-bold text-slate-800">{formatETB(amt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
