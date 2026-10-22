import { z } from 'zod';

export const academicYearSchema = z.object({
  name: z.string().min(2, 'Academic year name is required (e.g., 2026/2027)'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  isCurrent: z.boolean().optional(),
});

export const academicTermSchema = z.object({
  academicYearId: z.string().uuid('Valid academic year ID required'),
  name: z.string().min(2, 'Term name is required'),
  nameAmharic: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  isCurrent: z.boolean().optional(),
});

export const gradeSchema = z.object({
  name: z.string().min(1, 'Grade name is required'),
  nameAmharic: z.string().optional(),
  levelOrder: z.number().int().min(0).default(1),
  description: z.string().optional(),
});

export const classSectionSchema = z.object({
  gradeId: z.string().uuid('Valid grade ID required'),
  branchId: z.string().uuid('Valid branch ID required'),
  name: z.string().min(1, 'Section name is required (e.g. Section A)'),
  capacity: z.number().int().min(1).default(40),
  roomNumber: z.string().optional(),
});
