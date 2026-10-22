import { z } from 'zod';

export const createInvoiceSchema = z.object({
  studentId: z.string().uuid('Student ID is required'),
  academicYearId: z.string().uuid('Academic Year ID is required'),
  academicTermId: z.string().uuid().optional().nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      feeStructureId: z.string().uuid().optional().nullable(),
      feeName: z.string().min(1, 'Fee item name is required'),
      feeNameAmharic: z.string().optional(),
      quantity: z.number().int().min(1).default(1),
      unitAmount: z.number().positive('Unit amount must be greater than 0'),
      discountAmount: z.number().min(0).default(0),
    })
  ).min(1, 'Invoice must include at least one fee line item'),
});
