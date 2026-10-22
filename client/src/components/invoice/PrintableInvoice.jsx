import React from 'react';
import { Printer } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';

export const PrintableInvoice = ({ invoice, onClose }) => {
  const { formatETB, formatDate, lang } = useLanguage();

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const studentName =
    lang === 'am' && invoice.student?.firstNameAmharic
      ? `${invoice.student.firstNameAmharic} ${invoice.student.lastNameAmharic || ''}`
      : `${invoice.student?.firstName || ''} ${invoice.student?.lastName || ''}`;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="no-print flex items-center justify-between pb-3 border-b border-slate-200">
        <span className="text-xs text-slate-500 font-medium">Official School Fee Invoice</span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="print-area bg-white p-8 rounded-xl border border-slate-200 shadow-xs max-w-3xl mx-auto font-sans text-slate-800">
        {/* School Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              {invoice.school?.name || 'Abyssinia International Academy'}
            </h1>
            {invoice.school?.nameAmharic && (
              <p className="text-sm font-semibold text-slate-600">{invoice.school.nameAmharic}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {invoice.branch?.name} - {invoice.school?.address || 'Addis Ababa, Ethiopia'}
            </p>
            <p className="text-xs text-slate-500">Phone: {invoice.school?.phone || '+251 11 661 2233'} | Email: {invoice.school?.email || 'info@abyssinia.edu.et'}</p>
          </div>
          <div className="text-left sm:text-right">
            <Badge>{invoice.status}</Badge>
            <p className="text-lg font-bold text-slate-900 mt-2">{invoice.invoiceNumber}</p>
            <p className="text-xs text-slate-500">Issue: {formatDate(invoice.issueDate)}</p>
            <p className="text-xs font-semibold text-rose-600">Due: {formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        {/* Student & Term Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
          <div>
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-2">Billed To (Student)</h4>
            <p className="text-sm font-bold text-slate-900">{studentName}</p>
            <p className="text-slate-600 mt-0.5">Student ID: <span className="font-semibold text-slate-800">{invoice.student?.studentIdNumber}</span></p>
            <p className="text-slate-600">
              Grade: {invoice.student?.enrollments?.[0]?.classSection?.grade?.name || 'N/A'} - {invoice.student?.enrollments?.[0]?.classSection?.name || ''}
            </p>
            <p className="text-slate-600">Branch: {invoice.branch?.name}</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-2">Academic Billing Period</h4>
            <p className="font-semibold text-slate-800">Year: {invoice.academicYear?.name}</p>
            {invoice.academicTerm && <p className="text-slate-600">Term: {invoice.academicTerm?.name}</p>}
            <p className="text-slate-600 mt-2">
              Guardian: {invoice.student?.guardians?.[0]?.fullName || 'N/A'} ({invoice.student?.guardians?.[0]?.phone || 'N/A'})
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Fee Item Description</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Discount</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {lang === 'am' && item.feeNameAmharic ? item.feeNameAmharic : item.feeName}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{formatETB(item.unitAmount)}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right text-slate-600">
                    {Number(item.discountAmount) > 0 ? `-${formatETB(item.discountAmount)}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{formatETB(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t border-slate-200 text-xs gap-6">
          <div className="max-w-xs space-y-1">
            <h5 className="font-bold text-slate-800">Payment Instructions:</h5>
            <p className="text-slate-500">1. Commercial Bank of Ethiopia (CBE) A/C: 1000234567891</p>
            <p className="text-slate-500">2. Telebirr Shortcode / Merchant ID: 882244</p>
            <p className="text-slate-500">3. Always include Invoice Number as payment reference.</p>
          </div>

          <div className="w-full sm:w-64 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatETB(invoice.subtotal)}</span>
            </div>
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Total Discounts:</span>
                <span>-{formatETB(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Invoiced:</span>
              <span>{formatETB(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Amount Paid:</span>
              <span className="text-emerald-700 font-semibold">{formatETB(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 p-2.5 bg-slate-100 rounded-lg">
              <span>Balance Due:</span>
              <span className="text-rose-600">{formatETB(invoice.balanceAmount)}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-12 pt-6 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-xs text-center text-slate-500">
          <div>
            <div className="border-b border-slate-300 w-48 mx-auto mb-2"></div>
            <p className="font-medium text-slate-700">Accountant Signature & Stamp</p>
          </div>
          <div>
            <div className="border-b border-slate-300 w-48 mx-auto mb-2"></div>
            <p className="font-medium text-slate-700">Parent / Guardian Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
