import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Receipt, RotateCcw, CheckCircle, CreditCard, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/common/Card.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { PrintableReceipt } from '../components/receipt/PrintableReceipt.jsx';

export const PaymentsPage = () => {
  const { t, formatETB, formatDate } = useLanguage();
  const { hasRole } = useAuth();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Record Payment Modal State
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'CASH',
    referenceNumber: '',
    notes: '',
  });

  // Reversal Modal State
  const [reversalTarget, setReversalTarget] = useState(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalSubmitting, setReversalSubmitting] = useState(false);

  // Printable Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchPayments = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/payments', {
        page,
        limit: 15,
        paymentMethod: methodFilter,
      });
      if (res.success) {
        setPayments(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, [methodFilter]);

  // Load unpaid invoices for recording payment
  useEffect(() => {
    const loadUnpaidInvoices = async () => {
      try {
        const res = await api.get('/invoices', { limit: 100 });
        if (res.success) {
          const unpaid = res.data.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED' && i.balanceAmount > 0);
          setUnpaidInvoices(unpaid);
          if (unpaid[0]) {
            setPaymentForm((prev) => ({
              ...prev,
              invoiceId: unpaid[0].id,
              amount: unpaid[0].balanceAmount,
            }));
            setSelectedInvoice(unpaid[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load unpaid invoices:', err);
      }
    };
    loadUnpaidInvoices();
  }, [isRecordOpen]);

  const handleSelectInvoice = (invoiceId) => {
    const inv = unpaidInvoices.find((i) => i.id === invoiceId);
    setSelectedInvoice(inv || null);
    setPaymentForm({
      ...paymentForm,
      invoiceId,
      amount: inv ? inv.balanceAmount : '',
    });
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const idempotencyKey = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const res = await api.post('/payments', {
        ...paymentForm,
        amount: Number(paymentForm.amount),
        idempotencyKey,
      });

      if (res.success) {
        setIsRecordOpen(false);
        fetchPayments(1);
        // Automatically open the printable receipt!
        const rRes = await api.get(`/payments/${res.data.id}/receipt`);
        if (rRes.success) setSelectedReceipt(rRes.data);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to record payment');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenReceipt = async (paymentId) => {
    try {
      const res = await api.get(`/payments/${paymentId}/receipt`);
      if (res.success) setSelectedReceipt(res.data);
    } catch (err) {
      console.error('Failed to load receipt:', err);
    }
  };

  const handleReverseSubmit = async (e) => {
    e.preventDefault();
    if (!reversalTarget) return;
    setReversalSubmitting(true);

    try {
      const res = await api.post(`/payments/${reversalTarget.id}/reverse`, {
        reason: reversalReason,
      });
      if (res.success) {
        setReversalTarget(null);
        setReversalReason('');
        fetchPayments(pagination.page);
        alert('Payment reversed successfully.');
      }
    } catch (err) {
      alert(err.message || 'Failed to reverse payment');
    } finally {
      setReversalSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('paymentsList')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cash, CBE Birr, Telebirr, and bank transfer transaction records
          </p>
        </div>

        {hasRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'CASHIER', 'ACCOUNTANT') && (
          <Button
            variant="primary"
            onClick={() => setIsRecordOpen(true)}
            className="gap-2 shrink-0 shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            <span>{t('recordPaymentTitle')}</span>
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 bg-white"
            >
              <option value="">{t('all')} Payment Methods</option>
              <option value="CASH">CASH (ጥሬ ገንዘብ)</option>
              <option value="BANK_TRANSFER">BANK TRANSFER (ባንክ ዝውውር)</option>
              <option value="CBE_BIRR">CBE BIRR (ሲቢኢ ብር)</option>
              <option value="TELEBIRR">TELEBIRR (ቴሌብር)</option>
              <option value="CHECK">CHECK (ቼክ)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                <th className="py-3 px-5">{t('receiptNumber')}</th>
                <th className="py-3 px-4">{t('date')}</th>
                <th className="py-3 px-4">{t('fullName')}</th>
                <th className="py-3 px-4">{t('invoiceNumber')}</th>
                <th className="py-3 px-4">{t('amount')}</th>
                <th className="py-3 px-4">{t('paymentMethod')}</th>
                <th className="py-3 px-4">{t('referenceNumber')}</th>
                <th className="py-3 px-4">{t('cashier')}</th>
                <th className="py-3 px-4">{t('status')}</th>
                <th className="py-3 px-5 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {p.student?.firstName} {p.student?.lastName}
                      <span className="block text-[11px] text-slate-400 font-mono">
                        {p.student?.studentIdNumber} • {p.branch?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{p.invoice?.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">{formatETB(p.amount)}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{p.paymentMethod}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{p.referenceNumber || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.cashier?.fullName}</td>
                    <td className="py-3.5 px-4">
                      <Badge>{p.status}</Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenReceipt(p.id)}
                        className="py-1 px-2.5 text-xs gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </Button>
                      {p.status === 'COMPLETED' && hasRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT') && (
                        <button
                          onClick={() => setReversalTarget(p)}
                          title="Reverse Payment"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    {t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => fetchPayments(page)}
        />
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title={t('recordPaymentTitle')}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Unpaid Invoice *
            </label>
            <select
              required
              value={paymentForm.invoiceId}
              onChange={(e) => handleSelectInvoice(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-md bg-white font-medium"
            >
              {unpaidInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} - {inv.student?.firstName} {inv.student?.lastName} ({inv.student?.studentIdNumber}) • Balance: {formatETB(inv.balanceAmount)}
                </option>
              ))}
            </select>
          </div>

          {selectedInvoice && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Invoice Total:</span>
                <span>{formatETB(selectedInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Paid:</span>
                <span className="text-emerald-700 font-semibold">{formatETB(selectedInvoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-200">
                <span>Remaining Outstanding Balance:</span>
                <span className="text-rose-600">{formatETB(selectedInvoice.balanceAmount)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount to Pay (ETB) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="1"
                max={selectedInvoice ? selectedInvoice.balanceAmount : undefined}
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full p-2.5 text-sm font-bold text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('paymentMethod')} *
              </label>
              <select
                required
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-md bg-white font-medium"
              >
                <option value="CASH">Cash (ጥሬ ገንዘብ)</option>
                <option value="BANK_TRANSFER">Bank Transfer (ባንክ ዝውውር)</option>
                <option value="CBE_BIRR">CBE Birr (ሲቢኢ ብር)</option>
                <option value="TELEBIRR">Telebirr (ቴሌብር)</option>
                <option value="CHECK">Check (ቼክ)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bank Slip / Telebirr Transaction Reference #
            </label>
            <input
              type="text"
              value={paymentForm.referenceNumber}
              onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
              placeholder="e.g. CBE-TXN-1092837 or TB-9872134"
              className="w-full p-2 text-xs border border-slate-300 rounded-md font-mono"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsRecordOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" loading={formSubmitting}>
              Record Payment & Issue Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Reversal Modal */}
      <Modal
        isOpen={Boolean(reversalTarget)}
        onClose={() => setReversalTarget(null)}
        title="Confirm Payment Reversal"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleReverseSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Reversing receipt <strong>{reversalTarget?.receiptNumber}</strong> will restore ETB {reversalTarget?.amount?.toFixed(2)} to the invoice balance and log an immutable audit event.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('reversalReason')} *
            </label>
            <textarea
              required
              rows={3}
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="e.g. Bounced check, incorrect cashier amount entry, refunded."
              className="w-full p-2 text-xs border border-slate-300 rounded-md"
            ></textarea>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setReversalTarget(null)}>
              {t('cancel')}
            </Button>
            <Button variant="danger" type="submit" loading={reversalSubmitting}>
              Confirm Reversal
            </Button>
          </div>
        </form>
      </Modal>

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
