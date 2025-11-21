const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('./src/app');

async function debugAuth() {
  let mongoServer;

  try {
    console.log('=== STARTING DEBUG SESSION ===\n');
    
    // Start in-memory MongoDB for testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    console.log('1. Connecting to in-memory MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to test database\n');

    const testUser = {
      firstName: 'Test',
      lastName: 'Admin',
      email: 'testadmin@example.com',
      password: 'Test123!',
      phone: '+22890123456',
      role: 'admin',
      school: 'Test School'
    };

    console.log('2. Test data being sent:');
    console.log(JSON.stringify(testUser, null, 2));

    console.log('\n3. Making registration request...');
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    console.log('\n4. Response received:');
    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(response.body, null, 2));

    if (response.status === 400 && response.body.error) {
      console.log('\n5. VALIDATION ERRORS:');
      if (response.body.error.details) {
        response.body.error.details.forEach((detail, index) => {
          console.log(`   Error ${index + 1}: ${detail.message}`);
          console.log(`   Path: ${detail.path.join('.')}`);
        });
      } else {
        console.log('Error details:', response.body.error);
      }
    }

    if (response.status === 201) {
      console.log('\n✅ REGISTRATION SUCCESSFUL!');
      console.log('User created:', response.body.data.user.email);
      console.log('Token received:', response.body.token ? 'Yes' : 'No');
    }

  } catch (error) {
    console.log('\n❌ ERROR:');
    console.error(error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('\n✅ Database connection closed');
    }
    if (mongoServer) {
      await mongoServer.stop();
      console.log('✅ In-memory MongoDB stopped');
    }
  }
}

debugAuth();