// tests/teardown.js
const mongoose = require('mongoose');

module.exports = async () => {
  try {
    // Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('✅ Test database disconnected in teardown');
    }
  } catch (error) {
    console.error('❌ Error during test teardown:', error.message);
  }
  
  // Force exit after a short delay to ensure cleanup
  await new Promise(resolve => setTimeout(resolve, 1000));
};