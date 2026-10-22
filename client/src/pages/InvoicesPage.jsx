import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, FileText, Printer, Trash2, XCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/common/Card.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { PrintableInvoice } from '../components/invoice/PrintableInvoice.jsx';

export const InvoicesPage = () => {
  const { t, formatETB, formatDate } = useLanguage();
  const { hasRole } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Invoice creation modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [invoiceForm, setInvoiceForm] = useState({
    studentId: '',
    academicYearId: '',
    academicTermId: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    items: [
      { feeName: 'Term 1 Tuition Fee', unitAmount: 8500, quantity: 1, discountAmount: 0 },
    ],
  });

  const fetchInvoices = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/invoices', {
        page,
        limit: 15,
        search,
        status: statusFilter,
      });
      if (res.success) {
        setInvoices(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
  }, [search, statusFilter]);

  // Load auxiliary data for modal
  useEffect(() => {
    const loadSetupData = async () => {
      try {
        const [stuRes, feeRes, yrRes, termRes] = await Promise.all([
          api.get('/students', { limit: 100 }),
          api.get('/fees'),
          api.get('/academic/years'),
          api.get('/academic/terms'),
        ]);

        if (stuRes.success) setStudents(stuRes.data);
        if (feeRes.success) setFeeStructures(feeRes.data);
        if (yrRes.success) setAcademicYears(yrRes.data);
        if (termRes.success) setTerms(termRes.data);

        if (stuRes.data?.[0]) setInvoiceForm((prev) => ({ ...prev, studentId: stuRes.data[0].id }));
        const currentYear = yrRes.data?.find((y) => y.isCurrent) || yrRes.data?.[0];
        if (currentYear) setInvoiceForm((prev) => ({ ...prev, academicYearId: currentYear.id }));
        if (termRes.data?.[0]) setInvoiceForm((prev) => ({ ...prev, academicTermId: termRes.data[0].id }));
      } catch (err) {
        console.error('Failed to load invoice setup data:', err);
      }
    };
    loadSetupData();
  }, []);

  const handleAddItem = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: [...prev.items, { feeName: 'School Fee', unitAmount: 1000, quantity: 1, discountAmount: 0 }],
    }));
  };

  const handleRemoveItem = (index) => {
    if (invoiceForm.items.length <= 1) return;
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...invoiceForm.items];
    updated[index][field] = field === 'unitAmount' || field === 'quantity' || field === 'discountAmount'
      ? Number(value)
      : value;
    setInvoiceForm({ ...invoiceForm, items: updated });
  };

  const handleSelectFeeTemplate = (index, feeStructureId) => {
    const template = feeStructures.find((f) => f.id === feeStructureId);
    if (template) {
      const updated = [...invoiceForm.items];
      updated[index] = {
        feeStructureId: template.id,
        feeName: template.name,
        feeNameAmharic: template.nameAmharic,
        unitAmount: template.amount,
        quantity: 1,
        discountAmount: 0,
      };
      setInvoiceForm({ ...invoiceForm, items: updated });
    }
  };

  const calculateTotal = () => {
    return invoiceForm.items.reduce((acc, item) => {
      const sub = (item.unitAmount || 0) * (item.quantity || 1);
      return acc + Math.max(0, sub - (item.discountAmount || 0));
    }, 0);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const res = await api.post('/invoices', invoiceForm);
      if (res.success) {
        setIsCreateOpen(false);
        fetchInvoices(1);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to generate invoice');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}`);
      if (res.success) setSelectedInvoice(res.data);
    } catch (err) {
      console.error('Failed to load invoice details:', err);
    }
  };

  const handleCancelInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      const res = await api.patch(`/invoices/${invoiceId}/cancel`);
      if (res.success) fetchInvoices(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to cancel invoice');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('invoicesList')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Issued student tuition invoices, balances, and due dates
          </p>
        </div>

        {hasRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT') && (
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 shrink-0 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('createInvoice')}</span>
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice number or student name..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 bg-white"
            >
              <option value="">{t('all')} Statuses</option>
              <option value="ISSUED">ISSUED (Unpaid)</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="PAID">PAID</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                <th className="py-3 px-5">{t('invoiceNumber')}</th>
                <th className="py-3 px-4">{t('fullName')}</th>
                <th className="py-3 px-4">{t('issueDate')}</th>
                <th className="py-3 px-4">{t('dueDate')}</th>
                <th className="py-3 px-4">{t('totalAmount')}</th>
                <th className="py-3 px-4">{t('paidAmount')}</th>
                <th className="py-3 px-4">{t('balanceAmount')}</th>
                <th className="py-3 px-4">{t('status')}</th>
                <th className="py-3 px-5 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {inv.student?.firstName} {inv.student?.lastName}
                      <span className="block text-[11px] text-slate-400 font-mono">
                        {inv.student?.studentIdNumber} • {inv.branch?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(inv.issueDate)}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{formatDate(inv.dueDate)}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatETB(inv.totalAmount)}</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-semibold">{formatETB(inv.paidAmount)}</td>
                    <td className="py-3.5 px-4 text-rose-600 font-extrabold">{formatETB(inv.balanceAmount)}</td>
                    <td className="py-3.5 px-4">
                      <Badge>{inv.status}</Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewInvoice(inv.id)}
                        className="py-1 px-2.5 text-xs gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Button>
                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancelInvoice(inv.id)}
                          title="Cancel Invoice"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
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
          onPageChange={(page) => fetchInvoices(page)}
        />
      </Card>

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={t('createInvoice')}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Student *
              </label>
              <select
                required
                value={invoiceForm.studentId}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentIdNumber} - {s.firstName} {s.lastName} ({s.branch?.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Year *
              </label>
              <select
                required
                value={invoiceForm.academicYearId}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, academicYearId: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white"
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('dueDate')} *
              </label>
              <input
                type="date"
                required
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded-md"
              />
            </div>
          </div>

          {/* Line Items Editor */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Fee Line Items
              </h4>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddItem} className="text-xs gap-1 py-1 px-2">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t('addItem')}</span>
              </Button>
            </div>

            <div className="space-y-2.5">
              {invoiceForm.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      required
                      placeholder="Fee Item Description"
                      value={item.feeName}
                      onChange={(e) => handleItemChange(idx, 'feeName', e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-md"
                    />
                  </div>

                  <div className="w-full sm:w-28">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Amount"
                      value={item.unitAmount}
                      onChange={(e) => handleItemChange(idx, 'unitAmount', e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-md"
                    />
                  </div>

                  <div className="w-full sm:w-20">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-md text-center"
                    />
                  </div>

                  <div className="w-full sm:w-24">
                    <input
                      type="number"
                      min="0"
                      placeholder="Discount"
                      value={item.discountAmount}
                      onChange={(e) => handleItemChange(idx, 'discountAmount', e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-md text-emerald-700"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={invoiceForm.items.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Template Picker */}
            {feeStructures.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 font-semibold">Load from Fee Structure:</span>
                {feeStructures.slice(0, 4).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelectFeeTemplate(invoiceForm.items.length - 1, f.id)}
                    className="px-2 py-0.5 text-[11px] bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 rounded-md transition-all font-medium text-slate-600"
                  >
                    + {f.name} ({formatETB(f.amount)})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Total Bar */}
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Calculated Total Invoice Amount:
            </span>
            <span className="text-xl font-extrabold text-emerald-700">
              {formatETB(calculateTotal())}
            </span>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" loading={formSubmitting}>
              Generate & Issue Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Invoice Modal */}
      <Modal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title="Official Fee Invoice"
        maxWidth="max-w-3xl"
      >
        <PrintableInvoice invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      </Modal>
    </div>
  );
};
