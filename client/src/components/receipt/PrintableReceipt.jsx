import React from 'react';
import { Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Button } from '../common/Button.jsx';

export const PrintableReceipt = ({ payment, onClose }) => {
  const { formatETB, formatDate, lang } = useLanguage();

  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const studentName =
    lang === 'am' && payment.student?.firstNameAmharic
      ? `${payment.student.firstNameAmharic} ${payment.student.lastNameAmharic || ''}`
      : `${payment.student?.firstName || ''} ${payment.student?.lastName || ''}`;

  return (
    <div className="space-y-6">
      {/* Action controls (hidden when printing) */}
      <div className="no-print flex items-center justify-between pb-3 border-b border-slate-200">
        <span className="text-xs text-slate-500 font-medium">Official Payment Receipt Document</span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Printable Receipt Paper */}
      <div className="print-area bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs max-w-xl mx-auto font-sans text-slate-800">
        {/* Header */}
        <div className="text-center pb-5 border-b border-dashed border-slate-300">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            {payment.school?.name || 'Abyssinia International Academy'}
          </h2>
          {payment.school?.nameAmharic && (
            <p className="text-sm text-slate-600 font-medium mt-0.5">{payment.school.nameAmharic}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            {payment.branch?.name} - {payment.branch?.address || 'Addis Ababa, Ethiopia'}
          </p>
          <p className="text-xs text-slate-500">Phone: {payment.branch?.phone || payment.school?.phone || '+251 11 661 2233'}</p>

          <div className="mt-4 inline-block bg-slate-100 text-slate-800 px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase border border-slate-200">
            Official Payment Receipt
          </div>
        </div>

        {/* Receipt Meta */}
        <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-100">
          <div>
            <span className="text-slate-400 block">Receipt Number:</span>
            <span className="font-bold text-slate-800 text-sm">{payment.receiptNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Date & Time:</span>
            <span className="font-semibold text-slate-800">
              {formatDate(payment.paymentDate)} {new Date(payment.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Student & Invoice details */}
        <div className="py-4 space-y-2 text-xs border-b border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-500">Student Name:</span>
            <span className="font-bold text-slate-900">{studentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Student ID:</span>
            <span className="font-semibold text-slate-800">{payment.student?.studentIdNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Invoice Number:</span>
            <span className="font-semibold text-slate-800">{payment.invoice?.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Method:</span>
            <span className="font-semibold text-slate-800">{payment.paymentMethod}</span>
          </div>
          {payment.referenceNumber && (
            <div className="flex justify-between">
              <span className="text-slate-500">Txn / Slip Reference:</span>
              <span className="font-mono text-slate-800">{payment.referenceNumber}</span>
            </div>
          )}
        </div>

        {/* Amount Paid Highlight */}
        <div className="my-5 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
          <span className="text-xs text-emerald-800 font-medium uppercase tracking-wider block">
            Amount Paid
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 block mt-1">
            {formatETB(payment.amount)}
          </span>
        </div>

        {/* Balance summary */}
        {payment.invoice && (
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-200/60">
            <div className="flex justify-between text-slate-600">
              <span>Invoice Total:</span>
              <span>{formatETB(payment.invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Paid to Date:</span>
              <span>{formatETB(payment.invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Remaining Balance:</span>
              <span>{formatETB(payment.invoice.balanceAmount)}</span>
            </div>
          </div>
        )}

        {/* Footer verification & Cashier */}
        <div className="mt-8 pt-4 border-t border-dashed border-slate-300 text-xs text-slate-500 flex justify-between items-end">
          <div>
            <p>Issued by Cashier:</p>
            <p className="font-semibold text-slate-800">{payment.cashier?.fullName || 'Authorized Staff'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Smart School Fee Verified Transaction</p>
            <div className="flex items-center gap-1 text-emerald-600 font-semibold justify-end mt-0.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Valid Receipt</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
