const request = require('supertest');
const { app, init } = require('../server');
const pool = require('../config/db');

beforeAll(async () => {
  await init();
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email LIKE ?', ['test-%@test.com']);
  await pool.end();
});

describe('POST /api/auth/register', () => {
  const validUser = {
    nama: 'Test User',
    email: `test-${Date.now()}@test.com`,
    password: '123456',
  };

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Registrasi berhasil.');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.nama).toBe(validUser.nama);
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.field).toBe('email');
    expect(res.body.message).toBe('Email sudah terdaftar.');
  });

  it('should reject empty nama', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nama: '', email: 'test-empty@test.com', password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe('nama');
    expect(res.body.message).toBe('Nama wajib diisi.');
  });

  it('should reject nama < 2 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nama: 'A', email: 'test-short@test.com', password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe('nama');
    expect(res.body.message).toBe('Nama minimal 2 karakter.');
  });

  it('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nama: 'Test', email: 'not-an-email', password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe('email');
    expect(res.body.message).toBe('Format email tidak valid.');
  });

  it('should reject password < 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nama: 'Test', email: 'test-shortpw@test.com', password: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.field).toBe('password');
    expect(res.body.message).toBe('Password minimal 6 karakter.');
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('field');
    expect(res.body).toHaveProperty('message');
  });
});
