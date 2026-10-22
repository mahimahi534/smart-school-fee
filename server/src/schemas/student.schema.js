import { z } from 'zod';

export const registerStudentSchema = z.object({
  branchId: z.string().uuid('Branch ID is required'),
  academicYearId: z.string().uuid('Academic Year ID is required'),
  classSectionId: z.string().uuid('Class Section ID is required'),
  firstName: z.string().min(2, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name is required'),
  firstNameAmharic: z.string().optional(),
  middleNameAmharic: z.string().optional(),
  lastNameAmharic: z.string().optional(),
  gender: z.enum(['Male', 'Female']),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  emergencyPhone: z.string().min(6, 'Emergency phone number is required'),
  medicalNotes: z.string().optional(),
  guardian: z.object({
    fullName: z.string().min(2, 'Guardian full name is required'),
    fullNameAmharic: z.string().optional(),
    relation: z.string().min(2, 'Guardian relation is required (Father, Mother, Guardian)'),
    phone: z.string().min(6, 'Guardian phone number is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    occupation: z.string().optional(),
  }),
});

export const updateStudentSchema = z.object({
  branchId: z.string().uuid().optional(),
  firstName: z.string().min(2).optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(2).optional(),
  firstNameAmharic: z.string().optional(),
  middleNameAmharic: z.string().optional(),
  lastNameAmharic: z.string().optional(),
  gender: z.enum(['Male', 'Female']).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  emergencyPhone: z.string().optional(),
  medicalNotes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'SUSPENDED']).optional(),
});
