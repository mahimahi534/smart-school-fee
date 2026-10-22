import { prisma } from '../prisma.js';
import { generateInvoiceNumber } from '../utils/idGenerator.js';
import { logAuditEvent } from '../utils/audit.js';

export const getInvoices = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.query.schoolId;
    const branchId = req.tenantBranchId || req.query.branchId;
    const { studentId, status, academicYearId, academicTermId, search, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {
      schoolId,
      ...(branchId && { branchId }),
      ...(studentId && { studentId }),
      ...(status && { status }),
      ...(academicYearId && { academicYearId }),
      ...(academicTermId && { academicTermId }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search } },
          { student: { studentIdNumber: { contains: search } } },
          { student: { firstName: { contains: search } } },
          { student: { lastName: { contains: search } } },
        ],
      }),
    };

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
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
          branch: { select: { id: true, name: true, code: true } },
          academicYear: { select: { name: true } },
          academicTerm: { select: { name: true } },
          _count: { select: { items: true, payments: true } },
        },
        orderBy: { sequenceNumber: 'desc' },
      }),
    ]);

    // Check overdue status dynamically for items past due date with remaining balance
    const now = new Date();
    const formatted = invoices.map((inv) => {
      let currentStatus = inv.status;
      if (inv.status !== 'PAID' && inv.status !== 'CANCELLED' && new Date(inv.dueDate) < now && Number(inv.balanceAmount) > 0) {
        currentStatus = 'OVERDUE';
      }
      return {
        ...inv,
        status: currentStatus,
        subtotal: Number(inv.subtotal),
        discountAmount: Number(inv.discountAmount),
        totalAmount: Number(inv.totalAmount),
        paidAmount: Number(inv.paidAmount),
        balanceAmount: Number(inv.balanceAmount),
      };
    });

    res.json({
      success: true,
      data: formatted,
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

export const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        school: true,
        branch: true,
        academicYear: true,
        academicTerm: true,
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
        items: true,
        payments: {
          include: {
            cashier: { select: { fullName: true } },
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Branch isolation check
    if (req.tenantBranchId && invoice.branchId !== req.tenantBranchId) {
      return res.status(403).json({ success: false, message: 'Access denied to invoices outside your branch.' });
    }

    const now = new Date();
    let currentStatus = invoice.status;
    if (invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && new Date(invoice.dueDate) < now && Number(invoice.balanceAmount) > 0) {
      currentStatus = 'OVERDUE';
    }

    res.json({
      success: true,
      data: {
        ...invoice,
        status: currentStatus,
        subtotal: Number(invoice.subtotal),
        discountAmount: Number(invoice.discountAmount),
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        balanceAmount: Number(invoice.balanceAmount),
        items: invoice.items.map((item) => ({
          ...item,
          unitAmount: Number(item.unitAmount),
          discountAmount: Number(item.discountAmount),
          totalAmount: Number(item.totalAmount),
          paidAmount: Number(item.paidAmount),
        })),
        payments: invoice.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const { studentId, academicYearId, academicTermId, dueDate, notes, items } = req.body;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { school: true },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Branch verification
    if (req.tenantBranchId && student.branchId !== req.tenantBranchId) {
      return res.status(403).json({ success: false, message: 'Cannot invoice student from another branch.' });
    }

    // Compute subtotal, discounts, total
    let calculatedSubtotal = 0;
    let calculatedDiscount = 0;

    const processedItems = items.map((item) => {
      const lineSubtotal = item.unitAmount * (item.quantity || 1);
      const lineDiscount = item.discountAmount || 0;
      const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

      calculatedSubtotal += lineSubtotal;
      calculatedDiscount += lineDiscount;

      return {
        feeStructureId: item.feeStructureId || null,
        feeName: item.feeName,
        feeNameAmharic: item.feeNameAmharic || null,
        quantity: item.quantity || 1,
        unitAmount: item.unitAmount,
        discountAmount: lineDiscount,
        totalAmount: lineTotal,
        paidAmount: 0.00,
      };
    });

    const calculatedTotal = Math.max(0, calculatedSubtotal - calculatedDiscount);

    // Concurrency-safe invoice generation within transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const { invoiceNumber, sequenceNumber } = await generateInvoiceNumber(
        tx,
        schoolId,
        student.school.invoicePrefix || 'INV'
      );

      return await tx.invoice.create({
        data: {
          schoolId,
          branchId: student.branchId,
          studentId: student.id,
          academicYearId,
          academicTermId: academicTermId || null,
          invoiceNumber,
          sequenceNumber,
          issueDate: new Date(),
          dueDate: new Date(dueDate),
          subtotal: calculatedSubtotal,
          discountAmount: calculatedDiscount,
          totalAmount: calculatedTotal,
          paidAmount: 0.00,
          balanceAmount: calculatedTotal,
          status: 'ISSUED',
          notes: notes || null,
          items: {
            create: processedItems,
          },
        },
        include: {
          items: true,
        },
      });
    });

    await logAuditEvent({
      schoolId,
      branchId: invoice.branchId,
      actor: req.user,
      action: 'INVOICE_CREATED',
      entityType: 'Invoice',
      entityId: invoice.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        studentIdNumber: student.studentIdNumber,
        totalAmount: Number(invoice.totalAmount),
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} created successfully.`,
      data: {
        ...invoice,
        subtotal: Number(invoice.subtotal),
        discountAmount: Number(invoice.discountAmount),
        totalAmount: Number(invoice.totalAmount),
        balanceAmount: Number(invoice.balanceAmount),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (invoice.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Invoice is already cancelled.' });
    }

    const activePayments = invoice.payments.filter((p) => p.status === 'COMPLETED');
    if (activePayments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel invoice with completed payments. Reverse existing payments first.',
      });
    }

    const cancelled = await prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await logAuditEvent({
      schoolId: invoice.schoolId,
      branchId: invoice.branchId,
      actor: req.user,
      action: 'INVOICE_CANCELLED',
      entityType: 'Invoice',
      entityId: invoice.id,
      details: { invoiceNumber: invoice.invoiceNumber },
      req,
    });

    res.json({ success: true, message: `Invoice ${invoice.invoiceNumber} cancelled.`, data: cancelled });
  } catch (error) {
    next(error);
  }
};
