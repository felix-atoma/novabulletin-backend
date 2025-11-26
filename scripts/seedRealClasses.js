const mongoose = require('mongoose');
require('dotenv').config(); // Important: charger les variables d'environnement

// Import des modèles avec des chemins corrigés
const Class = require('../src/models/Classroom');
const School = require('../src/models/School');
const User = require('../src/models/User');

const seedRealClasses = async () => {
  try {
    console.log('🔗 Connexion à MongoDB...');
    
    // Utiliser l'URL de votre .env ou l'URL par défaut
    const mongoURI = process.env.DATABASE || 'mongodb://127.0.0.1:27017/novabulletin';
    console.log('📡 Tentative de connexion à:', mongoURI);
    
    // Connexion à la base de données avec timeout réduit
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 secondes timeout
      socketTimeoutMS: 45000, // 45 secondes socket timeout
    });

    console.log('✅ Connecté à MongoDB avec succès!');

    // Vérifier et créer une école si elle n'existe pas
    let school = await School.findOne();
    if (!school) {
      console.log('🏫 Création d\'une école par défaut...');
      school = await School.create({
        name: 'Lycée Modèle International',
        address: '123 Avenue de l\'Éducation, 75000 Paris',
        phone: '+33 1 23 45 67 89',
        email: 'contact@lycee-modele.fr',
        principal: 'Dr. Sophie Martin',
        academicYear: '2024-2025',
        isActive: true
      });
      console.log('✅ École créée:', school.name);
    } else {
      console.log('🏫 École trouvée:', school.name);
    }

    // Vérifier et créer un professeur si nécessaire
    let teacher = await User.findOne({ role: 'teacher', isActive: true });
    if (!teacher) {
      console.log('👨‍🏫 Création d\'un professeur par défaut...');
      teacher = await User.create({
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@lycee-modele.fr',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'teacher',
        phone: '+33 1 23 45 67 90',
        school: school._id,
        isActive: true
      });
      console.log('✅ Professeur créé:', teacher.firstName, teacher.lastName);
    } else {
      console.log('👨‍🏫 Professeur trouvé:', teacher.firstName, teacher.lastName);
    }

    // Données réelles des classes avec les séries
    const realClassesData = [
      // ========== MATERNELLE ==========
      { name: 'PS A', level: 'ps', capacity: 25, description: 'Petite Section - Première année de maternelle' },
      { name: 'MS A', level: 'ms', capacity: 28, description: 'Moyenne Section - Développement social' },
      { name: 'GS A', level: 'gs', capacity: 30, description: 'Grande Section - Préparation au CP' },

      // ========== PRIMAIRE ==========
      { name: 'CP A', level: 'cp', capacity: 32, description: 'Cours Préparatoire - Apprentissage lecture/écriture' },
      { name: 'CE1 A', level: 'ce1', capacity: 30, description: 'Cours Élémentaire 1ère année' },
      { name: 'CE2 A', level: 'ce2', capacity: 28, description: 'Cours Élémentaire 2ème année' },
      { name: 'CM1 A', level: 'cm1', capacity: 30, description: 'Cours Moyen 1ère année' },
      { name: 'CM2 A', level: 'cm2', capacity: 32, description: 'Cours Moyen 2ème année - Préparation collège' },

      // ========== COLLÈGE ==========
      { name: '6ème A', level: '6e', capacity: 35, description: 'Classe de 6ème - Adaptation collège' },
      { name: '5ème A', level: '5e', capacity: 34, description: 'Classe de 5ème' },
      { name: '4ème A', level: '4e', capacity: 36, description: 'Classe de 4ème' },
      { name: '3ème A', level: '3e', capacity: 35, description: 'Classe de 3ème - Préparation au brevet' },

      // ========== LYCÉE - SECONDE ==========
      { name: '2nde A4', level: '2nde', series: 'A4', capacity: 40, description: 'Seconde série A4 - Littéraire' },
      { name: '2nde D', level: '2nde', series: 'D', capacity: 38, description: 'Seconde série D - Scientifique' },
      { name: '2nde C', level: '2nde', series: 'C', capacity: 35, description: 'Seconde série C - Mathématiques' },
      
      // ========== LYCÉE - PREMIÈRE ==========
      { name: '1ère A4', level: '1ere', series: 'A4', capacity: 35, description: 'Première série A4 - Littéraire' },
      { name: '1ère D', level: '1ere', series: 'D', capacity: 36, description: 'Première série D - Scientifique' },
      { name: '1ère C', level: '1ere', series: 'C', capacity: 32, description: 'Première série C - Mathématiques' },
      { name: '1ère E', level: '1ere', series: 'E', capacity: 30, description: 'Première série E - Technologique' },
      { name: '1ère F', level: '1ere', series: 'F', capacity: 28, description: 'Première série F - Économie' },
      
      // ========== LYCÉE - TERMINALE ==========
      { name: 'Tle A4', level: 'terminale', series: 'A4', capacity: 30, description: 'Terminale série A4 - Littéraire' },
      { name: 'Tle D', level: 'terminale', series: 'D', capacity: 34, description: 'Terminale série D - Scientifique' },
      { name: 'Tle C', level: 'terminale', series: 'C', capacity: 31, description: 'Terminale série C - Mathématiques' },
      { name: 'Tle E', level: 'terminale', series: 'E', capacity: 28, description: 'Terminale série E - Technologique' },
      { name: 'Tle F', level: 'terminale', series: 'F', capacity: 29, description: 'Terminale série F - Économie' },
      { name: 'Tle A2', level: 'terminale', series: 'A2', capacity: 25, description: 'Terminale série A2 - Arts' },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    console.log('\n📚 Création des classes...');
    
    for (const classData of realClassesData) {
      try {
        // Vérifier si la classe existe déjà
        const existingClass = await Class.findOne({
          name: classData.name,
          level: classData.level,
          school: school._id,
          academicYear: '2024-2025'
        });

        if (!existingClass) {
          const newClass = await Class.create({
            ...classData,
            school: school._id,
            teacher: teacher ? teacher._id : null,
            academicYear: '2024-2025',
            isActive: true
          });
          createdCount++;
          console.log(`✅ ${newClass.name} (${classData.level}${classData.series ? ' - ' + classData.series : ''})`);
        } else {
          skippedCount++;
          console.log(`⏩ ${classData.name} - déjà existante`);
        }
      } catch (error) {
        console.error(`❌ Erreur avec ${classData.name}:`, error.message);
      }
    }

    console.log('\n🎉 RÉSULTAT DU SEEDING:');
    console.log(`✅ ${createdCount} nouvelles classes créées`);
    console.log(`⏩ ${skippedCount} classes déjà existantes`);
    console.log(`📚 Total: ${createdCount + skippedCount} classes dans la base de données`);

    // Afficher le résumé par niveau
    const classSummary = await Class.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 RÉPARTITION PAR NIVEAU:');
    classSummary.forEach(item => {
      console.log(`   ${item._id}: ${item.count} classe(s)`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\n🔧 SOLUTIONS POSSIBLES:');
      console.log('1. Démarrer MongoDB: mongod');
      console.log('2. Vérifier que MongoDB est installé');
      console.log('3. Vérifier l\'URL dans le fichier .env');
      console.log('4. Utiliser: mongodb://127.0.0.1:27017/novabulletin');
    }
  } finally {
    // Fermer la connexion MongoDB
    await mongoose.connection.close();
    console.log('\n🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
};

// Gestion des erreurs non catchées
process.on('unhandledRejection', (err) => {
  console.error('❌ Erreur non gérée:', err);
  process.exit(1);
});

// Exécuter le script
console.log('🚀 Démarrage du seeding des classes...');
seedRealClasses();