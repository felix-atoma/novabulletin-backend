const request = require('supertest');
const app = require('../src/app');

async function debugAuth() {
  console.log('=== DEBUG AUTH ENDPOINT ===');
  
  const userData = {
    firstName: 'Test',
    lastName: 'Admin',
    email: 'testadmin@example.com',
    password: 'Test123!',
    phone: '+22890123456',
    role: 'admin',
    school: 'Test School'
  };

  console.log('Sending registration request with data:', userData);
  
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send(userData);

  console.log('Response status:', response.status);
  console.log('Response body:', JSON.stringify(response.body, null, 2));
  
  if (response.body.error) {
    console.log('Validation errors:', response.body.error.details);
  }
}

debugAuth();