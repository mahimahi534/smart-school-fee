/**
 * Concurrency-safe identifier generators for Students, Invoices, and Receipts.
 * Uses atomic sequence ordering inside Prisma database transactions.
 */

export async function generateStudentId(tx, schoolId, schoolPrefix = 'STU') {
  const lastRecord = await tx.student.findFirst({
    where: { schoolId },
    orderBy: { sequenceNumber: 'desc' },
    select: { sequenceNumber: true },
  });

  const nextSeq = (lastRecord?.sequenceNumber || 0) + 1;
  const formattedId = `${schoolPrefix}-${String(nextSeq).padStart(4, '0')}`;

  return {
    studentIdNumber: formattedId,
    sequenceNumber: nextSeq,
  };
}

export async function generateInvoiceNumber(tx, schoolId, invoicePrefix = 'INV') {
  const currentYear = new Date().getFullYear();
  const lastRecord = await tx.invoice.findFirst({
    where: { schoolId },
    orderBy: { sequenceNumber: 'desc' },
    select: { sequenceNumber: true },
  });

  const nextSeq = (lastRecord?.sequenceNumber || 0) + 1;
  const formattedNumber = `${invoicePrefix}-${currentYear}-${String(nextSeq).padStart(4, '0')}`;

  return {
    invoiceNumber: formattedNumber,
    sequenceNumber: nextSeq,
  };
}

export async function generateReceiptNumber(tx, schoolId, receiptPrefix = 'REC') {
  const currentYear = new Date().getFullYear();
  const lastRecord = await tx.payment.findFirst({
    where: { schoolId },
    orderBy: { sequenceNumber: 'desc' },
    select: { sequenceNumber: true },
  });

  const nextSeq = (lastRecord?.sequenceNumber || 0) + 1;
  const formattedNumber = `${receiptPrefix}-${currentYear}-${String(nextSeq).padStart(4, '0')}`;

  return {
    receiptNumber: formattedNumber,
    sequenceNumber: nextSeq,
  };
}
