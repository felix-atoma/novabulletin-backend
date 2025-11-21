const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./src/app');

async function debugRegistration() {
  console.log('=== DEBUGGING REGISTRATION ENDPOINT ===\n');

  const testUser = {
    firstName: 'Test',
    lastName: 'Admin',
    email: 'testadmin@example.com',
    password: 'Test123!',
    phone: '+22890123456',
    role: 'admin',
    school: 'Test School'
  };

  console.log('1. Test data being sent:');
  console.log(JSON.stringify(testUser, null, 2));

  try {
    console.log('\n2. Making registration request...');
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    console.log('\n3. Response received:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Body:', JSON.stringify(response.body, null, 2));

    if (response.status === 400 && response.body.error) {
      console.log('\n4. Validation errors found:');
      console.log(JSON.stringify(response.body.error, null, 2));
    }

  } catch (error) {
    console.log('\n5. Error occurred:');
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
}

// Connect to database and run debug
mongoose.connect('mongodb://localhost:27017/novabulletin_test')
  .then(() => {
    console.log('Connected to test database');
    debugRegistration();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });