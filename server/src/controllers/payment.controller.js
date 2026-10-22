import { prisma } from '../prisma.js';
import { generateReceiptNumber } from '../utils/idGenerator.js';
import { logAuditEvent } from '../utils/audit.js';

export const recordPayment = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const cashierId = req.user.id;
    const {
      invoiceId,
      amount,
      paymentMethod,
      referenceNumber,
      notes,
      idempotencyKey,
    } = req.body;

    // Idempotency check: if key provided, check if already processed
    if (idempotencyKey) {
      const existingPayment = await prisma.payment.findUnique({
        where: { idempotencyKey },
        include: {
          student: true,
          invoice: true,
        },
      });

      if (existingPayment) {
        return res.json({
          success: true,
          message: 'Payment already recorded (idempotent submission).',
          data: {
            ...existingPayment,
            amount: Number(existingPayment.amount),
          },
        });
      }
    }

    // Fetch invoice with items
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        school: true,
        branch: true,
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (invoice.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot record payment for a cancelled invoice.' });
    }

    if (invoice.status === 'PAID' || Number(invoice.balanceAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'This invoice has already been paid in full.' });
    }

    // Branch isolation check
    if (req.tenantBranchId && invoice.branchId !== req.tenantBranchId) {
      return res.status(403).json({ success: false, message: 'Cannot record payment for an invoice from another branch.' });
    }

    const currentBalance = Number(invoice.balanceAmount);
    if (amount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (ETB ${amount.toFixed(2)}) exceeds remaining balance (ETB ${currentBalance.toFixed(2)}).`,
      });
    }

    // Execute transactional payment recording
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate sequential receipt number
      const { receiptNumber, sequenceNumber } = await generateReceiptNumber(
        tx,
        schoolId,
        invoice.school.receiptPrefix || 'REC'
      );

      // 2. Create Payment record
      const payment = await tx.payment.create({
        data: {
          schoolId,
          branchId: invoice.branchId,
          studentId: invoice.studentId,
          invoiceId: invoice.id,
          receiptNumber,
          sequenceNumber,
          amount,
          paymentMethod,
          referenceNumber: referenceNumber?.trim() || null,
          cashierId,
          status: 'COMPLETED',
          idempotencyKey: idempotencyKey || null,
          notes: notes || null,
        },
      });

      // 3. Allocate payment to line items (fill unpaid lines sequentially)
      let unallocatedAmount = amount;
      for (const item of invoice.items) {
        if (unallocatedAmount <= 0) break;

        const itemTotal = Number(item.totalAmount);
        const itemPaid = Number(item.paidAmount);
        const itemRemaining = Math.max(0, itemTotal - itemPaid);

        if (itemRemaining > 0) {
          const allocationForThisItem = Math.min(unallocatedAmount, itemRemaining);

          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              invoiceId: invoice.id,
              invoiceItemId: item.id,
              amount: allocationForThisItem,
            },
          });

          await tx.invoiceItem.update({
            where: { id: item.id },
            data: {
              paidAmount: { increment: allocationForThisItem },
            },
          });

          unallocatedAmount -= allocationForThisItem;
        }
      }

      // If any amount was not linked to an item, record general invoice allocation
      if (unallocatedAmount > 0) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            invoiceId: invoice.id,
            amount: unallocatedAmount,
          },
        });
      }

      // 4. Update Invoice paidAmount and balanceAmount
      const newPaidAmount = Number(invoice.paidAmount) + amount;
      const newBalanceAmount = Math.max(0, Number(invoice.totalAmount) - newPaidAmount);
      const newStatus = newBalanceAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newStatus,
        },
      });

      return { payment, updatedInvoice };
    });

    await logAuditEvent({
      schoolId,
      branchId: invoice.branchId,
      actor: req.user,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: result.payment.id,
      details: {
        receiptNumber: result.payment.receiptNumber,
        invoiceNumber: invoice.invoiceNumber,
        amount,
        method: paymentMethod,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Payment recorded successfully. Receipt ${result.payment.receiptNumber} generated.`,
      data: {
        ...result.payment,
        amount: Number(result.payment.amount),
        remainingBalance: Number(result.updatedInvoice.balanceAmount),
        invoiceStatus: result.updatedInvoice.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.query.schoolId;
    const branchId = req.tenantBranchId || req.query.branchId;
    const { studentId, invoiceId, cashierId, paymentMethod, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {
      schoolId,
      ...(branchId && { branchId }),
      ...(studentId && { studentId }),
      ...(invoiceId && { invoiceId }),
      ...(cashierId && { cashierId }),
      ...(paymentMethod && { paymentMethod }),
      ...(status && { status }),
      ...(startDate && endDate && {
        paymentDate: {
          gte: new Date(startDate),
          lte: new Date(`${endDate}T23:59:59.999Z`),
        },
      }),
    };

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take,
        include: {
          student: {
            select: {
              id: true,
              studentIdNumber: true,
              firstName: true,
              lastName: true,
              firstNameAmharic: true,
              lastNameAmharic: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              balanceAmount: true,
            },
          },
          cashier: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
          reversal: true,
        },
        orderBy: { paymentDate: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        invoice: {
          ...p.invoice,
          totalAmount: Number(p.invoice.totalAmount),
          balanceAmount: Number(p.invoice.balanceAmount),
        },
      })),
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        school: true,
        branch: true,
        student: {
          include: {
            guardians: { where: { isPrimary: true }, take: 1 },
            enrollments: {
              where: { status: 'ACTIVE' },
              take: 1,
              include: {
                classSection: {
                  include: { grade: true },
                },
              },
            },
          },
        },
        invoice: {
          include: {
            academicYear: true,
            academicTerm: true,
            items: true,
          },
        },
        cashier: {
          select: { id: true, fullName: true, email: true },
        },
        allocations: {
          include: { invoiceItem: true },
        },
        reversal: {
          include: {
            reversedBy: { select: { fullName: true } },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (req.tenantBranchId && payment.branchId !== req.tenantBranchId) {
      return res.status(403).json({ success: false, message: 'Access denied to payments outside your branch.' });
    }

    res.json({
      success: true,
      data: {
        ...payment,
        amount: Number(payment.amount),
        invoice: {
          ...payment.invoice,
          subtotal: Number(payment.invoice.subtotal),
          discountAmount: Number(payment.invoice.discountAmount),
          totalAmount: Number(payment.invoice.totalAmount),
          paidAmount: Number(payment.invoice.paidAmount),
          balanceAmount: Number(payment.invoice.balanceAmount),
          items: payment.invoice.items.map((i) => ({
            ...i,
            unitAmount: Number(i.unitAmount),
            discountAmount: Number(i.discountAmount),
            totalAmount: Number(i.totalAmount),
            paidAmount: Number(i.paidAmount),
          })),
        },
        allocations: payment.allocations.map((a) => ({
          ...a,
          amount: Number(a.amount),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const reversePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reversedById = req.user.id;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: true,
        allocations: true,
        reversal: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    if (payment.status === 'REVERSED' || payment.reversal) {
      return res.status(400).json({ success: false, message: 'This payment has already been reversed.' });
    }

    if (req.tenantBranchId && payment.branchId !== req.tenantBranchId) {
      return res.status(403).json({ success: false, message: 'Cannot reverse payment from another branch.' });
    }

    const paymentAmount = Number(payment.amount);

    // Reversal transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark payment as REVERSED
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: { status: 'REVERSED' },
      });

      // 2. Create Reversal Audit record
      const reversalRecord = await tx.paymentReversal.create({
        data: {
          paymentId: payment.id,
          reversedById,
          reason,
        },
      });

      // 3. Rollback item-level paidAmount
      for (const alloc of payment.allocations) {
        if (alloc.invoiceItemId) {
          await tx.invoiceItem.update({
            where: { id: alloc.invoiceItemId },
            data: {
              paidAmount: { decrement: alloc.amount },
            },
          });
        }
      }

      // 4. Rollback invoice paidAmount & balanceAmount
      const updatedPaidAmount = Math.max(0, Number(payment.invoice.paidAmount) - paymentAmount);
      const updatedBalanceAmount = Number(payment.invoice.totalAmount) - updatedPaidAmount;
      const updatedStatus = updatedPaidAmount === 0 ? 'ISSUED' : 'PARTIALLY_PAID';

      const updatedInvoice = await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: updatedPaidAmount,
          balanceAmount: updatedBalanceAmount,
          status: updatedStatus,
        },
      });

      return { updatedPayment, reversalRecord, updatedInvoice };
    });

    await logAuditEvent({
      schoolId: payment.schoolId,
      branchId: payment.branchId,
      actor: req.user,
      action: 'PAYMENT_REVERSED',
      entityType: 'Payment',
      entityId: payment.id,
      details: {
        receiptNumber: payment.receiptNumber,
        amount: paymentAmount,
        reason,
        reversedBy: req.user.fullName,
      },
      req,
    });

    res.json({
      success: true,
      message: `Payment ${payment.receiptNumber} has been reversed. Invoice balance restored to ETB ${result.updatedInvoice.balanceAmount.toFixed(2)}.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
