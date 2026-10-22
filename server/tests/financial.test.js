import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { prisma } from '../src/prisma.js';

describe('Financial & School Management Integration Test Suite', () => {
  let adminToken = '';
  let cashierToken = '';
  let testBranchId = '';
  let testAcademicYearId = '';
  let testClassSectionId = '';
  let testStudentId = '';
  let createdInvoiceId = '';
  let createdPaymentId = '';

  beforeAll(async () => {
    // Authenticate as School Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@abyssinia.edu.et', password: 'Password123!' });
    adminToken = adminLogin.body.token;

    // Authenticate as Cashier
    const cashierLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cashier@abyssinia.edu.et', password: 'Password123!' });
    cashierToken = cashierLogin.body.token;

    // Get branch, academic year, and section
    const branchRes = await request(app)
      .get('/api/schools/branches')
      .set('Authorization', `Bearer ${adminToken}`);
    testBranchId = branchRes.body.data[0].id;

    const yearRes = await request(app)
      .get('/api/academic/years')
      .set('Authorization', `Bearer ${adminToken}`);
    testAcademicYearId = yearRes.body.data[0].id;

    const sectionRes = await request(app)
      .get('/api/academic/sections')
      .set('Authorization', `Bearer ${adminToken}`);
    testClassSectionId = sectionRes.body.data[0].id;
  });

  it('1. Should register student with atomic sequential Student ID (e.g. AF-XXXX)', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        branchId: testBranchId,
        academicYearId: testAcademicYearId,
        classSectionId: testClassSectionId,
        firstName: 'Robel',
        middleName: 'Tilahun',
        lastName: 'Girma',
        firstNameAmharic: 'ሮቤል',
        lastNameAmharic: 'ግርማ',
        gender: 'Male',
        emergencyPhone: '+251911998877',
        guardian: {
          fullName: 'Tilahun Girma',
          relation: 'Father',
          phone: '+251911998877',
          email: 'tilahun.g@test.et',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.studentIdNumber).toMatch(/^AF-\d{4}$/);
    testStudentId = res.body.data.id;
  });

  it('2. Should create fee structure for academic year', async () => {
    const res = await request(app)
      .post('/api/fees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicYearId: testAcademicYearId,
        category: 'TUITION',
        name: 'Elementary Term 2 Tuition',
        nameAmharic: 'የ2ኛ ሩብ ዓመት ትምህርት ክፍያ',
        amount: 6000.00,
        frequency: 'TERM_BASED',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(6000);
  });

  it('3. Should create itemized invoice with sequential invoice number', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: testStudentId,
        academicYearId: testAcademicYearId,
        dueDate: '2026-11-30',
        items: [
          { feeName: 'Term Tuition Fee', unitAmount: 5000.00, quantity: 1, discountAmount: 0 },
          { feeName: 'Exam Paper Fee', unitAmount: 500.00, quantity: 1, discountAmount: 0 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    expect(res.body.data.totalAmount).toBe(5500);
    expect(res.body.data.balanceAmount).toBe(5500);
    expect(res.body.data.status).toBe('ISSUED');

    createdInvoiceId = res.body.data.id;
  });

  it('4. Should record partial payment and correctly update invoice balance', async () => {
    const idempotencyKey = `test_part_${Date.now()}`;
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        invoiceId: createdInvoiceId,
        amount: 2000.00,
        paymentMethod: 'TELEBIRR',
        referenceNumber: 'TB-TEST-99212',
        idempotencyKey,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(2000);
    expect(res.body.data.remainingBalance).toBe(3500);
    expect(res.body.data.invoiceStatus).toBe('PARTIALLY_PAID');
    expect(res.body.data.receiptNumber).toMatch(/^REC-\d{4}-\d{4}$/);

    createdPaymentId = res.body.data.id;
  });

  it('5. Should prevent double-charging with same idempotency key', async () => {
    const idempotencyKey = 'duplicate_payment_prevention_key_123';
    // First submission
    await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        invoiceId: createdInvoiceId,
        amount: 500.00,
        paymentMethod: 'CASH',
        idempotencyKey,
      });

    // Re-submission with same idempotency key
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        invoiceId: createdInvoiceId,
        amount: 500.00,
        paymentMethod: 'CASH',
        idempotencyKey,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('idempotent');
  });

  it('6. Should reject payment exceeding invoice remaining balance', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        invoiceId: createdInvoiceId,
        amount: 999999.00,
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('exceeds');
  });

  it('7. Should reverse payment and restore invoice balance', async () => {
    const res = await request(app)
      .post(`/api/payments/${createdPaymentId}/reverse`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Accidental duplicate test entry reversed' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('reversed');
  });

  it('8. Should generate daily collections report with aggregated totals', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .get(`/api/reports/daily?date=${today}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.byMethod).toBeDefined();
  });

  it('9. Should prevent cancelling an invoice that has completed payments', async () => {
    // invoice 1 has payments recorded during seed
    const invoicesRes = await request(app)
      .get('/api/invoices')
      .set('Authorization', `Bearer ${adminToken}`);
    const paidInvoice = invoicesRes.body.data.find((i) => i.status === 'PAID');

    const res = await request(app)
      .patch(`/api/invoices/${paidInvoice.id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('completed payments');
  });

  it('10. Should fetch payment receipt details with line item allocations', async () => {
    const res = await request(app)
      .get(`/api/payments/${createdPaymentId}/receipt`)
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.receiptNumber).toBeDefined();
    expect(res.body.data.allocations).toBeInstanceOf(Array);
  });
});
