import { z } from 'zod';

export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid('Invoice ID is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: z.enum([
    'CASH',
    'BANK_TRANSFER',
    'CBE_BIRR',
    'TELEBIRR',
    'CHECK',
    'OTHER',
  ]),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional(),
  idempotencyKey: z.string().min(8, 'Idempotency key is required to prevent double charging').optional(),
});

export const reversePaymentSchema = z.object({
  reason: z.string().min(5, 'Detailed reason for reversal is required'),
});
