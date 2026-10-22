import { prisma } from '../prisma.js';

export const getDailyCollections = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.query.schoolId;
    const branchId = req.tenantBranchId || req.query.branchId;
    const targetDateStr = req.query.date || new Date().toISOString().split('T')[0];

    const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);

    const where = {
      schoolId,
      status: 'COMPLETED',
      ...(branchId && { branchId }),
      paymentDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          select: {
            studentIdNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        cashier: { select: { fullName: true } },
        branch: { select: { name: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    let totalAmount = 0;
    const byMethod = {};
    const byCashier = {};

    payments.forEach((p) => {
      const amt = Number(p.amount);
      totalAmount += amt;

      byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + amt;

      const cashierName = p.cashier?.fullName || 'Unknown';
      byCashier[cashierName] = (byCashier[cashierName] || 0) + amt;
    });

    res.json({
      success: true,
      data: {
        date: targetDateStr,
        totalTransactions: payments.length,
        totalAmount,
        byMethod,
        byCashier,
        payments: payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyCollections = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.query.schoolId;
    const branchId = req.tenantBranchId || req.query.branchId;
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);

    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    const payments = await prisma.payment.findMany({
      where: {
        schoolId,
        status: 'COMPLETED',
        ...(branchId && { branchId }),
        paymentDate: { gte: startOfYear, lte: endOfYear },
      },
      select: {
        amount: true,
        paymentDate: true,
        paymentMethod: true,
      },
    });

    const months = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i + 1,
      monthName: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
      total: 0,
      count: 0,
    }));

    payments.forEach((p) => {
      const d = new Date(p.paymentDate);
      const mIdx = d.getMonth();
      months[mIdx].total += Number(p.amount);
      months[mIdx].count += 1;
    });

    res.json({
      success: true,
      data: {
        year,
        totalYearAmount: months.reduce((acc, m) => acc + m.total, 0),
        monthlyBreakdown: months,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOutstandingReport = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.query.schoolId;
    const branchId = req.tenantBranchId || req.query.branchId;
    const { gradeId, academicYearId } = req.query;

    const where = {
      schoolId,
      status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
      balanceAmount: { gt: 0 },
      ...(branchId && { branchId }),
      ...(academicYearId && { academicYearId }),
      ...(gradeId && {
        student: {
          enrollments: {
            some: { classSection: { gradeId }, status: 'ACTIVE' },
          },
        },
      }),
    };

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        student: {
          include: {
            branch: { select: { name: true } },
            guardians: { where: { isPrimary: true }, take: 1 },
            enrollments: {
              where: { status: 'ACTIVE' },
              take: 1,
              include: { classSection: { include: { grade: true } } },
            },
          },
        },
        academicYear: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const totalOutstanding = invoices.reduce((acc, inv) => acc + Number(inv.balanceAmount), 0);

    const now = new Date();
    const formatted = invoices.map((inv) => {
      const isPastDue = new Date(inv.dueDate) < now;
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        studentIdNumber: inv.student.studentIdNumber,
        studentName: `${inv.student.firstName} ${inv.student.lastName}`,
        branchName: inv.student.branch?.name,
        gradeName: inv.student.enrollments[0]?.classSection?.grade?.name || 'N/A',
        sectionName: inv.student.enrollments[0]?.classSection?.name || 'N/A',
        guardianPhone: inv.student.guardians[0]?.phone || 'N/A',
        dueDate: inv.dueDate,
        totalAmount: Number(inv.totalAmount),
        paidAmount: Number(inv.paidAmount),
        balanceAmount: Number(inv.balanceAmount),
        status: isPastDue ? 'OVERDUE' : inv.status,
      };
    });

    res.json({
      success: true,
      data: {
        totalInvoices: invoices.length,
        totalOutstanding,
        records: formatted,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCashierReport = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.query.schoolId;
    const branchId = req.tenantBranchId || req.query.branchId;
    const { cashierId, startDate, endDate } = req.query;

    const where = {
      schoolId,
      status: 'COMPLETED',
      ...(branchId && { branchId }),
      ...(cashierId && { cashierId }),
      ...(startDate && endDate && {
        paymentDate: {
          gte: new Date(startDate),
          lte: new Date(`${endDate}T23:59:59.999Z`),
        },
      }),
    };

    const payments = await prisma.payment.findMany({
      where,
      include: {
        cashier: { select: { id: true, fullName: true, email: true } },
      },
    });

    const summaryByCashier = {};
    payments.forEach((p) => {
      const cId = p.cashierId;
      if (!summaryByCashier[cId]) {
        summaryByCashier[cId] = {
          cashierId: cId,
          cashierName: p.cashier?.fullName || 'Unknown',
          email: p.cashier?.email,
          totalCollected: 0,
          transactionCount: 0,
          byMethod: {},
        };
      }
      const amt = Number(p.amount);
      summaryByCashier[cId].totalCollected += amt;
      summaryByCashier[cId].transactionCount += 1;
      summaryByCashier[cId].byMethod[p.paymentMethod] = (summaryByCashier[cId].byMethod[p.paymentMethod] || 0) + amt;
    });

    res.json({
      success: true,
      data: Object.values(summaryByCashier),
    });
  } catch (error) {
    next(error);
  }
};

export const exportReportCsv = async (req, res, next) => {
  try {
    const { type } = req.query;
    const schoolId = req.user.schoolId;

    if (type === 'payments') {
      const payments = await prisma.payment.findMany({
        where: { schoolId },
        include: {
          student: true,
          invoice: true,
          cashier: true,
          branch: true,
        },
        orderBy: { paymentDate: 'desc' },
      });

      const header = 'Receipt Number,Date,Student ID,Student Name,Branch,Invoice Number,Amount (ETB),Payment Method,Reference,Cashier,Status\n';
      const rows = payments.map((p) => [
        `"${p.receiptNumber}"`,
        `"${new Date(p.paymentDate).toISOString().split('T')[0]}"`,
        `"${p.student?.studentIdNumber}"`,
        `"${p.student?.firstName} ${p.student?.lastName}"`,
        `"${p.branch?.name}"`,
        `"${p.invoice?.invoiceNumber}"`,
        Number(p.amount).toFixed(2),
        `"${p.paymentMethod}"`,
        `"${p.referenceNumber || ''}"`,
        `"${p.cashier?.fullName}"`,
        `"${p.status}"`,
      ].join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="smart_school_payments.csv"');
      return res.send(header + rows);
    }

    if (type === 'outstanding') {
      const invoices = await prisma.invoice.findMany({
        where: {
          schoolId,
          balanceAmount: { gt: 0 },
        },
        include: {
          student: true,
          branch: true,
        },
        orderBy: { dueDate: 'asc' },
      });

      const header = 'Invoice Number,Student ID,Student Name,Branch,Issue Date,Due Date,Total (ETB),Paid (ETB),Balance (ETB),Status\n';
      const rows = invoices.map((inv) => [
        `"${inv.invoiceNumber}"`,
        `"${inv.student?.studentIdNumber}"`,
        `"${inv.student?.firstName} ${inv.student?.lastName}"`,
        `"${inv.branch?.name}"`,
        `"${new Date(inv.issueDate).toISOString().split('T')[0]}"`,
        `"${new Date(inv.dueDate).toISOString().split('T')[0]}"`,
        Number(inv.totalAmount).toFixed(2),
        Number(inv.paidAmount).toFixed(2),
        Number(inv.balanceAmount).toFixed(2),
        `"${inv.status}"`,
      ].join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="smart_school_outstanding.csv"');
      return res.send(header + rows);
    }

    res.status(400).json({ success: false, message: 'Invalid export type. Supported: payments, outstanding' });
  } catch (error) {
    next(error);
  }
};
