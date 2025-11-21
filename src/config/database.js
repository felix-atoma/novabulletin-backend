const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('Erreur de connexion MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB déconnecté');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Connexion MongoDB fermée');
      process.exit(0);
    });

  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;