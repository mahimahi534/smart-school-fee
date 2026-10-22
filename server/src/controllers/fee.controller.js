import { prisma } from '../prisma.js';
import { logAuditEvent } from '../utils/audit.js';

export const getFeeStructures = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId || req.query.schoolId;
    const { academicYearId, academicTermId, category, gradeId, branchId } = req.query;

    const where = {
      schoolId,
      ...(academicYearId && { academicYearId }),
      ...(academicTermId && { academicTermId }),
      ...(category && { category }),
      ...(gradeId && { OR: [{ gradeId }, { gradeId: null }] }),
      ...(branchId && { OR: [{ branchId }, { branchId: null }] }),
    };

    const fees = await prisma.feeStructure.findMany({
      where,
      include: {
        academicYear: { select: { id: true, name: true } },
        academicTerm: { select: { id: true, name: true } },
        grade: { select: { id: true, name: true } },
        _count: { select: { invoiceItems: true } },
      },
      orderBy: [{ category: 'asc' }, { amount: 'asc' }],
    });

    res.json({
      success: true,
      data: fees.map((f) => ({
        ...f,
        amount: Number(f.amount),
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createFeeStructure = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const {
      academicYearId,
      academicTermId,
      branchId,
      gradeId,
      category,
      name,
      nameAmharic,
      amount,
      frequency,
      dueDate,
      description,
    } = req.body;

    const fee = await prisma.feeStructure.create({
      data: {
        schoolId,
        academicYearId,
        academicTermId: academicTermId || null,
        branchId: branchId || null,
        gradeId: gradeId || null,
        category,
        name: name.trim(),
        nameAmharic: nameAmharic?.trim() || null,
        amount,
        frequency,
        dueDate: dueDate ? new Date(dueDate) : null,
        description: description || null,
        isActive: true,
      },
    });

    await logAuditEvent({
      schoolId,
      actor: req.user,
      action: 'FEE_STRUCTURE_CREATED',
      entityType: 'FeeStructure',
      entityId: fee.id,
      details: { name: fee.name, amount: Number(fee.amount), category: fee.category },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Fee structure created successfully.',
      data: { ...fee, amount: Number(fee.amount) },
    });
  } catch (error) {
    next(error);
  }
};

export const updateFeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, nameAmharic, amount, dueDate, description, isActive } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (nameAmharic !== undefined) updateData.nameAmharic = nameAmharic?.trim() || null;
    if (amount !== undefined) updateData.amount = amount;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.feeStructure.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      schoolId: updated.schoolId,
      actor: req.user,
      action: 'FEE_STRUCTURE_UPDATED',
      entityType: 'FeeStructure',
      entityId: updated.id,
      details: updateData,
      req,
    });

    res.json({
      success: true,
      message: 'Fee structure updated successfully.',
      data: { ...updated, amount: Number(updated.amount) },
    });
  } catch (error) {
    next(error);
  }
};
