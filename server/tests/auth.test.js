import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';

describe('Authentication & Access Control Test Suite', () => {
  it('GET /api/health should return system status healthy and database connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBe('connected');
  });

  it('POST /api/auth/login should reject invalid credentials with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@abyssinia.edu.et', password: 'WrongPassword999!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login should accept valid credentials and return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@abyssinia.edu.et', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('SCHOOL_ADMIN');
  });

  it('GET /api/auth/me should return 401 when token is missing', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/bootstrap-admin should reject with 403 when setup secret is incorrect', async () => {
    const res = await request(app)
      .post('/api/auth/bootstrap-admin')
      .send({
        setupSecret: 'invalid_secret_attempt',
        email: 'attacker@evil.com',
        password: 'Password123!',
        fullName: 'Attacker',
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
