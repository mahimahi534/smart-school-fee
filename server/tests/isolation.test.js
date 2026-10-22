import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { en } from '../../client/src/locales/en.js';
import { am } from '../../client/src/locales/am.js';

describe('Tenant Isolation, RBAC & Localization Tests', () => {
  let viewerToken = '';

  beforeAll(async () => {
    const viewerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'viewer@abyssinia.edu.et', password: 'Password123!' });
    viewerToken = viewerLogin.body.token;
  });

  it('Viewer role should be forbidden from creating invoices (403)', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        studentId: '00000000-0000-0000-0000-000000000000',
        academicYearId: '00000000-0000-0000-0000-000000000000',
        dueDate: '2026-12-31',
        items: [{ feeName: 'Test', unitAmount: 100, quantity: 1 }],
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Viewer role should be forbidden from recording payments (403)', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        invoiceId: '00000000-0000-0000-0000-000000000000',
        amount: 500,
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Localization: All English translation keys must exist in Amharic dictionary', () => {
    const enKeys = Object.keys(en);
    const amKeys = Object.keys(am);

    const missingInAmharic = enKeys.filter((key) => !(key in am));
    expect(missingInAmharic).toEqual([]);
    expect(amKeys.length).toBeGreaterThanOrEqual(enKeys.length);
  });
});
