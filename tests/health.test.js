// tests/health.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Health Check Endpoints', () => {
  it('should return API health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.message).toContain('running');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('environment', 'test');
  });

  it('should return welcome message on root', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body.message).toContain('Bienvenue');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('environment', 'test');
  });

  it('should handle 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/unknown-route')
      .expect(404);

    expect(response.body.status).toBe('error');
    expect(response.body.message).toContain('non trouvée');
  });
});