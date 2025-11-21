// server.js - Main entry point
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./src/app');
const { configureCloudStorage } = require('./src/config/cloudStorage');

// Charger les variables d'environnement
dotenv.config();

// Gestion des exceptions non capturées
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Configuration de la base de données
const DB = process.env.MONGODB_URI || process.env.DATABASE;

// Database connection with proper error handling
const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Already connected to MongoDB');
      return;
    }

    // If connected to different DB, disconnect first
    if (mongoose.connection.readyState !== 0) {
      console.log('🔄 Closing existing MongoDB connection...');
      await mongoose.disconnect();
    }

    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(DB, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    
    console.log('✅ Connexion à la base de données réussie');
  } catch (err) {
    console.error('❌ Erreur de connexion à la base de données:', err);
    process.exit(1);
  }
};

// Start the application
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Configuration de Cloud Storage
    if (process.env.NODE_ENV === 'production') {
      configureCloudStorage();
    } else {
      console.log('📁 Mode développement: stockage local activé');
    }

    // Démarrage du serveur
    const port = process.env.PORT || 5000;
    const server = app.listen(port, () => {
      console.log(`🚀 Serveur démarré sur le port ${port}`);
      console.log(`📍 Environnement: ${process.env.NODE_ENV}`);
      console.log(`🔗 API disponible sur: http://localhost:${port}/api/v1`);
    });

    // Gestion des rejets de promesses non gérés
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Gestion de l'arrêt gracieux
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM reçu. Arrêt gracieux du serveur...');
      server.close(() => {
        console.log('💤 Processus terminé');
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();