import { z } from 'zod';

export const feeStructureSchema = z.object({
  academicYearId: z.string().uuid('Academic Year ID is required'),
  academicTermId: z.string().uuid().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
  gradeId: z.string().uuid().optional().nullable(),
  category: z.enum([
    'TUITION',
    'REGISTRATION',
    'EXAMINATION',
    'TRANSPORT',
    'UNIFORM',
    'MEAL',
    'FACILITY',
    'OTHER',
  ]),
  name: z.string().min(2, 'Fee title/name is required'),
  nameAmharic: z.string().optional(),
  amount: z.number().positive('Fee amount must be greater than 0'),
  frequency: z.enum(['ONE_TIME', 'TERM_BASED', 'MONTHLY', 'ANNUAL']).default('TERM_BASED'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD').optional().nullable(),
  description: z.string().optional(),
});
