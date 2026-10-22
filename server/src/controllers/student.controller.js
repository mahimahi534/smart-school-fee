import { prisma } from '../prisma.js';
import { generateStudentId } from '../utils/idGenerator.js';
import { logAuditEvent } from '../utils/audit.js';

export const getStudents = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.query.schoolId;
    const branchId = req.tenantBranchId || req.query.branchId;
    const { search, status, gradeId, classSectionId, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {
      schoolId,
      ...(branchId && { branchId }),
      ...(status && { status }),
      ...(classSectionId && {
        enrollments: {
          some: { classSectionId, status: 'ACTIVE' },
        },
      }),
      ...(gradeId && {
        enrollments: {
          some: {
            classSection: { gradeId },
            status: 'ACTIVE',
          },
        },
      }),
      ...(search && {
        OR: [
          { studentIdNumber: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { middleName: { contains: search } },
          { firstNameAmharic: { contains: search } },
          { lastNameAmharic: { contains: search } },
        ],
      }),
    };

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take,
        include: {
          branch: { select: { id: true, name: true, code: true } },
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
          _count: {
            select: { invoices: true, payments: true },
          },
        },
        orderBy: { sequenceNumber: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: students,
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

export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        branch: true,
        guardians: true,
        enrollments: {
          include: {
            academicYear: true,
            classSection: {
              include: { grade: true },
            },
          },
          orderBy: { enrollmentDate: 'desc' },
        },
        invoices: {
          include: {
            academicYear: true,
            academicTerm: true,
            items: true,
            payments: {
              select: {
                id: true,
                receiptNumber: true,
                amount: true,
                paymentMethod: true,
                paymentDate: true,
                status: true,
              },
            },
          },
          orderBy: { issueDate: 'desc' },
        },
        payments: {
          include: {
            cashier: { select: { fullName: true } },
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Branch isolation check
    if (req.tenantBranchId && student.branchId !== req.tenantBranchId) {
      return res.status(403).json({ success: false, message: 'Access denied to students outside your branch.' });
    }

    // Calculate total invoiced, total paid, and total outstanding balance
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    student.invoices.forEach((inv) => {
      totalInvoiced += Number(inv.totalAmount);
      totalPaid += Number(inv.paidAmount);
      totalBalance += Number(inv.balanceAmount);
    });

    res.json({
      success: true,
      data: {
        ...student,
        financialSummary: {
          totalInvoiced,
          totalPaid,
          totalBalance,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerStudent = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const {
      branchId,
      academicYearId,
      classSectionId,
      firstName,
      middleName,
      lastName,
      firstNameAmharic,
      middleNameAmharic,
      lastNameAmharic,
      gender,
      dateOfBirth,
      address,
      city,
      emergencyPhone,
      medicalNotes,
      guardian,
    } = req.body;

    // Verify branch scope
    if (req.tenantBranchId && req.tenantBranchId !== branchId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot register student outside your assigned branch.',
      });
    }

    // Get school prefix
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { studentIdPrefix: true },
    });

    // Transaction for atomic sequence increment and registration
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate concurrency-safe sequential Student ID
      const { studentIdNumber, sequenceNumber } = await generateStudentId(
        tx,
        schoolId,
        school?.studentIdPrefix || 'STU'
      );

      // 2. Create Student
      const newStudent = await tx.student.create({
        data: {
          schoolId,
          branchId,
          studentIdNumber,
          sequenceNumber,
          firstName: firstName.trim(),
          middleName: middleName?.trim() || null,
          lastName: lastName.trim(),
          firstNameAmharic: firstNameAmharic?.trim() || null,
          middleNameAmharic: middleNameAmharic?.trim() || null,
          lastNameAmharic: lastNameAmharic?.trim() || null,
          gender,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          address: address || null,
          city: city || 'Addis Ababa',
          emergencyPhone,
          medicalNotes: medicalNotes || null,
          status: 'ACTIVE',
        },
      });

      // 3. Create Primary Guardian
      await tx.guardian.create({
        data: {
          studentId: newStudent.id,
          fullName: guardian.fullName.trim(),
          fullNameAmharic: guardian.fullNameAmharic?.trim() || null,
          relation: guardian.relation,
          phone: guardian.phone,
          email: guardian.email || null,
          occupation: guardian.occupation || null,
          isPrimary: true,
        },
      });

      // 4. Create Active Enrollment
      await tx.enrollment.create({
        data: {
          studentId: newStudent.id,
          academicYearId,
          classSectionId,
          status: 'ACTIVE',
        },
      });

      return newStudent;
    });

    await logAuditEvent({
      schoolId,
      branchId,
      actor: req.user,
      action: 'STUDENT_REGISTERED',
      entityType: 'Student',
      entityId: result.id,
      details: { studentIdNumber: result.studentIdNumber, name: `${result.firstName} ${result.lastName}` },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Student registered successfully with Student ID: ${result.studentIdNumber}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    const updated = await prisma.student.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      schoolId: updated.schoolId,
      branchId: updated.branchId,
      actor: req.user,
      action: 'STUDENT_UPDATED',
      entityType: 'Student',
      entityId: updated.id,
      details: req.body,
      req,
    });

    res.json({ success: true, message: 'Student updated successfully.', data: updated });
  } catch (error) {
    next(error);
  }
};

export const updateStudentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.student.update({
      where: { id },
      data: { status },
    });

    await logAuditEvent({
      schoolId: updated.schoolId,
      branchId: updated.branchId,
      actor: req.user,
      action: 'STUDENT_STATUS_CHANGED',
      entityType: 'Student',
      entityId: updated.id,
      details: { newStatus: status },
      req,
    });

    res.json({ success: true, message: `Student status updated to ${status}.`, data: updated });
  } catch (error) {
    next(error);
  }
};
