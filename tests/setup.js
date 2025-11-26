// tests/setup.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test timeout
jest.setTimeout(30000);

// Setup before all tests
beforeAll(async () => {
  try {
    console.log('🔄 Connecting to test database...');
    
    // Use test database
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/novabulletin-test';
    
    // Disconnect from any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      // Wait for disconnect to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Connect to test database with modern settings
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 5,
    });

    console.log('✅ Connected to test database');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error.message);
    throw error;
  }
});

// ✅ REMOVED afterEach - DO NOT DELETE DATA BETWEEN TESTS
// This was causing the user to be deleted after registration
// Each test file should manage its own cleanup in beforeAll/afterAll

// Cleanup after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      // Close connection
      await mongoose.disconnect();
      console.log('✅ Disconnected from test database');
    }
  } catch (error) {
    console.error('❌ Error during test cleanup:', error.message);
    // Force disconnect on error
    await mongoose.disconnect().catch(() => {});
  }
});

// Global error handlers for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});