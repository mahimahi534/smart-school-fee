import { prisma } from '../prisma.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const schoolId = req.user.role === 'SUPER_ADMIN' ? (req.query.schoolId || req.user.schoolId) : req.user.schoolId;
    const branchId = req.tenantBranchId || req.query.branchId;

    const baseWhereSchool = schoolId ? { schoolId } : {};
    const baseWhereBranch = branchId ? { branchId } : {};

    // 1. Total Registered Students
    const totalStudents = await prisma.student.count({
      where: {
        ...baseWhereSchool,
        ...baseWhereBranch,
        status: 'ACTIVE',
      },
    });

    // 2. Fees collected today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayPaymentsAgg = await prisma.payment.aggregate({
      where: {
        ...baseWhereSchool,
        ...baseWhereBranch,
        status: 'COMPLETED',
        paymentDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const feesCollectedToday = Number(todayPaymentsAgg._sum.amount || 0);

    // 3. Total fees collected all-time / current academic year
    const totalPaymentsAgg = await prisma.payment.aggregate({
      where: {
        ...baseWhereSchool,
        ...baseWhereBranch,
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });
    const totalFeesCollected = Number(totalPaymentsAgg._sum.amount || 0);

    // 4. Total Outstanding Fees
    const outstandingInvoicesAgg = await prisma.invoice.aggregate({
      where: {
        ...baseWhereSchool,
        ...baseWhereBranch,
        status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      _sum: {
        balanceAmount: true,
      },
    });
    const totalOutstandingFees = Number(outstandingInvoicesAgg._sum.balanceAmount || 0);

    // 5. Overdue Invoices Count
    const now = new Date();
    const overdueCount = await prisma.invoice.count({
      where: {
        ...baseWhereSchool,
        ...baseWhereBranch,
        OR: [
          { status: 'OVERDUE' },
          {
            status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
            dueDate: { lt: now },
            balanceAmount: { gt: 0 },
          },
        ],
      },
    });

    // 6. Recent Payments
    const recentPayments = await prisma.payment.findMany({
      where: {
        ...baseWhereSchool,
        ...baseWhereBranch,
      },
      orderBy: { paymentDate: 'desc' },
      take: 6,
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
        branch: {
          select: { name: true, nameAmharic: true },
        },
        cashier: {
          select: { fullName: true },
        },
      },
    });

    // 7. Monthly Collection Summary (past 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const completedPayments = await prisma.payment.findMany({
      where: {
        ...baseWhereSchool,
        ...baseWhereBranch,
        status: 'COMPLETED',
        paymentDate: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        paymentDate: true,
      },
    });

    // Group payments by Month (YYYY-MM)
    const monthlyMap = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      monthlyMap[key] = { month: monthLabel, year: d.getFullYear(), total: 0 };
    }

    completedPayments.forEach((p) => {
      const d = new Date(p.paymentDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].total += Number(p.amount);
      }
    });

    const monthlyTrends = Object.values(monthlyMap);

    res.json({
      success: true,
      data: {
        totalStudents,
        feesCollectedToday,
        totalFeesCollected,
        totalOutstandingFees,
        overdueCount,
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          receiptNumber: p.receiptNumber,
          amount: Number(p.amount),
          paymentMethod: p.paymentMethod,
          paymentDate: p.paymentDate,
          status: p.status,
          student: p.student,
          branchName: p.branch?.name,
          cashierName: p.cashier?.fullName,
        })),
        monthlyTrends,
      },
    });
  } catch (error) {
    next(error);
  }
};
