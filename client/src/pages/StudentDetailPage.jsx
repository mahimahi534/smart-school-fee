import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Building,
  GraduationCap,
  CreditCard,
  FileText,
  Receipt,
  PlusCircle,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/common/Card.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { PrintableReceipt } from '../components/receipt/PrintableReceipt.jsx';
import { PrintableInvoice } from '../components/invoice/PrintableInvoice.jsx';

export const StudentDetailPage = () => {
  const { id } = useParams();
  const { t, formatETB, formatDate, lang } = useLanguage();
  const { hasRole } = useAuth();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchStudent = async () => {
    try {
      const res = await api.get(`/students/${id}`);
      if (res.success) {
        setStudent(res.data);
      }
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const handleOpenReceipt = async (paymentId) => {
    try {
      const res = await api.get(`/payments/${paymentId}/receipt`);
      if (res.success) setSelectedReceipt(res.data);
    } catch (err) {
      console.error('Failed to load receipt:', err);
    }
  };

  const handleOpenInvoice = async (invoiceId) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}`);
      if (res.success) setSelectedInvoice(res.data);
    } catch (err) {
      console.error('Failed to load invoice:', err);
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

  if (!student) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">Student record not found.</p>
        <Link to="/students" className="mt-4 inline-block">
          <Button variant="secondary" size="sm">
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  const enrollment = student.enrollments?.[0];
  const primaryGuardian = student.guardians?.find((g) => g.isPrimary) || student.guardians?.[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top back button */}
      <div className="flex items-center justify-between">
        <Link to="/students" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students Directory</span>
        </Link>
        <Badge>{student.status}</Badge>
      </div>

      {/* Student Overview Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-2xl flex items-center justify-center border border-emerald-100 shadow-xs">
            {student.firstName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {student.firstName} {student.middleName || ''} {student.lastName}
              </h1>
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {student.studentIdNumber}
              </span>
            </div>
            {student.firstNameAmharic && (
              <p className="text-sm font-medium text-slate-600 mt-0.5">
                {student.firstNameAmharic} {student.middleNameAmharic || ''} {student.lastNameAmharic || ''}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>{student.branch?.name}</span>
              <span>•</span>
              <span>{enrollment?.classSection?.grade?.name || 'Unassigned'} ({enrollment?.classSection?.name || 'Section'})</span>
            </p>
          </div>
        </div>

        {/* Quick Financial Summary Box */}
        <div className="flex items-center gap-4 w-full sm:w-auto p-4 bg-slate-50 rounded-xl border border-slate-100 justify-between sm:justify-start">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Remaining Balance
            </span>
            <span className="text-xl font-extrabold text-rose-600 block">
              {formatETB(student.financialSummary?.totalBalance || 0)}
            </span>
          </div>

          {hasRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'CASHIER', 'ACCOUNTANT') && (
            <Link to="/payments">
              <Button variant="primary" size="sm" className="gap-1.5 shrink-0">
                <CreditCard className="w-4 h-4" />
                <span>Pay Fee</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Info Grid (Profile, Guardian, Enrollment) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Student Profile">
          <dl className="text-xs space-y-2.5">
            <div className="flex justify-between">
              <dt className="text-slate-500">Gender:</dt>
              <dd className="font-semibold text-slate-800">{student.gender}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Date of Birth:</dt>
              <dd className="font-semibold text-slate-800">{formatDate(student.dateOfBirth)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Emergency Phone:</dt>
              <dd className="font-mono font-semibold text-slate-800">{student.emergencyPhone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">City & Address:</dt>
              <dd className="font-semibold text-slate-800 text-right">{student.address || student.city}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Primary Guardian">
          {primaryGuardian ? (
            <dl className="text-xs space-y-2.5">
              <div className="flex justify-between">
                <dt className="text-slate-500">Guardian Name:</dt>
                <dd className="font-bold text-slate-800">{primaryGuardian.fullName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Relationship:</dt>
                <dd className="font-semibold text-slate-800">{primaryGuardian.relation}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Phone Number:</dt>
                <dd className="font-mono font-semibold text-slate-800">{primaryGuardian.phone}</dd>
              </div>
              {primaryGuardian.email && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Email:</dt>
                  <dd className="font-semibold text-slate-800">{primaryGuardian.email}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-xs text-slate-400">No guardian registered</p>
          )}
        </Card>

        <Card title="Enrollment Info">
          <dl className="text-xs space-y-2.5">
            <div className="flex justify-between">
              <dt className="text-slate-500">Academic Year:</dt>
              <dd className="font-semibold text-slate-800">{enrollment?.academicYear?.name || 'N/A'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Grade Level:</dt>
              <dd className="font-semibold text-slate-800">{enrollment?.classSection?.grade?.name || 'N/A'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Class Section:</dt>
              <dd className="font-semibold text-slate-800">{enrollment?.classSection?.name || 'N/A'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Enrollment Status:</dt>
              <dd className="font-semibold text-emerald-600">{enrollment?.status || 'ACTIVE'}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Invoices History Table */}
      <Card
        title={t('invoicesHistory')}
        subtitle="All fee invoices issued to this student"
      >
        <div className="overflow-x-auto -mx-5 -my-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                <th className="py-2.5 px-5 font-semibold">{t('invoiceNumber')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('issueDate')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('dueDate')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('totalAmount')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('paidAmount')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('balanceAmount')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('status')}</th>
                <th className="py-2.5 px-5 font-semibold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {student.invoices?.length > 0 ? (
                student.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(inv.issueDate)}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{formatDate(inv.dueDate)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatETB(inv.totalAmount)}</td>
                    <td className="py-3 px-4 text-emerald-700 font-semibold">{formatETB(inv.paidAmount)}</td>
                    <td className="py-3 px-4 text-rose-600 font-bold">{formatETB(inv.balanceAmount)}</td>
                    <td className="py-3 px-4">
                      <Badge>{inv.status}</Badge>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenInvoice(inv.id)}
                        className="text-xs gap-1 py-1 px-2.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Invoice</span>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No invoices recorded for this student.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payments History Table */}
      <Card
        title={t('paymentsHistory')}
        subtitle="All payments processed and verified for this student"
      >
        <div className="overflow-x-auto -mx-5 -my-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                <th className="py-2.5 px-5 font-semibold">{t('receiptNumber')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('date')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('amount')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('paymentMethod')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('referenceNumber')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('cashier')}</th>
                <th className="py-2.5 px-4 font-semibold">{t('status')}</th>
                <th className="py-2.5 px-5 font-semibold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {student.payments?.length > 0 ? (
                student.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{formatETB(p.amount)}</td>
                    <td className="py-3 px-4 text-slate-700">{p.paymentMethod}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.referenceNumber || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{p.cashier?.fullName}</td>
                    <td className="py-3 px-4">
                      <Badge>{p.status}</Badge>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenReceipt(p.id)}
                        className="text-xs gap-1 py-1 px-2.5"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No payment history found.
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
