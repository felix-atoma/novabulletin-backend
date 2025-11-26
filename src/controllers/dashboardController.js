// controllers/dashboardController.js - SIMPLIFIED VERSION
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Grade = require('../models/Grade');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Parent = require('../models/Parent');
const School = require('../models/School');

console.log('📊 Dashboard controller loaded successfully');

exports.getStats = async (req, res) => {
  try {
    console.log('📊 Getting dashboard stats for user:', req.user._id, 'role:', req.user.role);
    
    const schoolId = req.user.school?._id;
    let stats = {
      totalStudents: 0,
      totalTeachers: 0,
      averageSuccessRate: 0,
      pendingPayments: 0
    };

    try {
      switch (req.user.role) {
        case 'director':
          stats.totalStudents = await Student.countDocuments({ school: schoolId }).catch(() => 0);
          stats.totalTeachers = await Teacher.countDocuments({ school: schoolId }).catch(() => 0);
          stats.pendingPayments = await Payment.countDocuments({ school: schoolId, status: 'pending' }).catch(() => 0);
          break;
        
        case 'teacher':
          stats.totalStudents = 25; // Mock data for teacher
          stats.totalTeachers = 1;
          stats.averageSuccessRate = 82;
          break;
        
        case 'student':
          stats.totalStudents = 1;
          stats.totalTeachers = 8;
          stats.averageSuccessRate = 85;
          stats.pendingPayments = await Payment.countDocuments({ student: req.user._id, status: 'pending' }).catch(() => 0);
          break;
        
        case 'parent':
          const parent = await Parent.findOne({ user: req.user._id }).populate('children').catch(() => null);
          const childrenIds = parent?.children?.map(child => child._id) || [];
          stats.totalStudents = childrenIds.length;
          stats.totalTeachers = 12;
          stats.averageSuccessRate = 79;
          stats.pendingPayments = await Payment.countDocuments({ student: { $in: childrenIds }, status: 'pending' }).catch(() => 0);
          break;
      }
    } catch (error) {
      console.log('⚠️ Error getting role-specific stats:', error.message);
      // Use default stats
    }

    console.log('📊 Stats calculated:', stats);
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(400).json({ 
      status: 'error', 
      message: 'Erreur lors de la récupération des statistiques: ' + error.message 
    });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    console.log('📋 Getting recent activity for user:', req.user._id);
    
    let activities = [{
      type: 'system',
      description: 'Bienvenue sur NovaBulletin',
      time: 'Maintenant',
      metadata: {}
    }];

    // Add role-specific mock activities
    switch (req.user.role) {
      case 'director':
        activities.push({
          type: 'registration',
          description: '2 nouvelles inscriptions en attente',
          time: '1 heure',
          metadata: { pendingCount: 2 }
        });
        break;
      
      case 'teacher':
        activities.push({
          type: 'grade',
          description: 'Notes du contrôle de Physique saisies',
          time: '30 minutes',
          metadata: {}
        });
        break;
      
      case 'student':
        activities.push({
          type: 'grade',
          description: 'Nouvelle note en Mathématiques: 16/20',
          time: '1 heure',
          metadata: {}
        });
        break;
      
      case 'parent':
        activities.push({
          type: 'bulletin',
          description: 'Nouveaux bulletins disponibles pour vos enfants',
          time: '1 jour',
          metadata: {}
        });
        break;
    }

    res.status(200).json({
      status: 'success',
      data: activities
    });
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(400).json({ 
      status: 'error', 
      message: 'Erreur lors de la récupération des activités: ' + error.message 
    });
  }
};

exports.getUpcomingEvents = async (req, res) => {
  try {
    const events = [
      {
        title: 'Conseil de classe',
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        type: 'meeting'
      },
      {
        title: 'Remise des bulletins',
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        type: 'academic'
      }
    ];

    res.status(200).json({
      status: 'success',
      data: events
    });
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    res.status(400).json({ 
      status: 'error', 
      message: 'Erreur lors de la récupération des événements: ' + error.message 
    });
  }
};

exports.getQuickActions = async (req, res) => {
  try {
    const baseActions = [
      {
        title: 'Voir les élèves',
        description: 'Liste complète des élèves',
        icon: 'users',
        color: 'blue',
        link: '/students'
      }
    ];

    const roleActions = {
      director: [
        ...baseActions,
        {
          title: 'Inscriptions en attente',
          description: 'Approuver les nouvelles inscriptions',
          icon: 'user-plus',
          color: 'yellow',
          link: '/admin/registrations'
        },
        {
          title: 'Gérer les paiements',
          description: 'Paiements en attente',
          icon: 'dollar-sign',
          color: 'green',
          link: '/payments'
        },
        {
          title: 'Générer bulletins',
          description: 'Créer les bulletins scolaires',
          icon: 'file-text',
          color: 'red',
          link: '/bulletins/generate'
        }
      ],
      teacher: [
        ...baseActions,
        {
          title: 'Saisir des notes',
          description: 'Entrer les notes des élèves',
          icon: 'clipboard-list',
          color: 'green',
          link: '/grades'
        },
        {
          title: 'Mes classes',
          description: 'Voir mes classes et élèves',
          icon: 'graduation-cap',
          color: 'purple',
          link: '/classes'
        },
        {
          title: 'Statistiques',
          description: 'Analyses et rapports',
          icon: 'bar-chart-3',
          color: 'purple',
          link: '/statistics'
        }
      ],
      parent: [
        {
          title: 'Bulletins de mes enfants',
          description: 'Consulter les résultats',
          icon: 'file-text',
          color: 'blue',
          link: '/parent/bulletins'
        },
        {
          title: 'Paiements',
          description: 'Gérer les frais scolaires',
          icon: 'dollar-sign',
          color: 'green',
          link: '/payments'
        }
      ],
      student: [
        {
          title: 'Mes bulletins',
          description: 'Consulter mes résultats',
          icon: 'file-text',
          color: 'blue',
          link: '/student/bulletins'
        },
        {
          title: 'Mes notes',
          description: 'Voir toutes mes notes',
          icon: 'trending-up',
          color: 'green',
          link: '/student/grades'
        }
      ]
    };

    const actions = roleActions[req.user.role] || baseActions;
    
    res.status(200).json({
      status: 'success',
      data: actions
    });
  } catch (error) {
    console.error('Error getting quick actions:', error);
    res.status(400).json({ 
      status: 'error', 
      message: 'Erreur lors de la récupération des actions rapides: ' + error.message 
    });
  }
};

// Remove the problematic getUserDashboard function for now
// We'll implement it properly later
exports.getUserDashboard = async (req, res) => {
  try {
    // For now, return basic data without calling other controller methods
    const stats = {
      totalStudents: 0,
      totalTeachers: 0,
      averageSuccessRate: 0,
      pendingPayments: 0
    };

    const activities = [{
      type: 'system',
      description: 'Bienvenue sur NovaBulletin',
      time: 'Maintenant',
      metadata: {}
    }];

    const events = [
      {
        title: 'Conseil de classe',
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        type: 'meeting'
      }
    ];

    const baseActions = [{
      title: 'Voir les élèves',
      description: 'Liste complète des élèves',
      icon: 'users',
      color: 'blue',
      link: '/students'
    }];

    res.status(200).json({
      status: 'success',
      data: {
        stats,
        activities,
        events,
        actions: baseActions,
        user: {
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
          school: req.user.school
        }
      }
    });
  } catch (error) {
    console.error('Error getting user dashboard:', error);
    res.status(400).json({ 
      status: 'error', 
      message: 'Erreur lors de la récupération du tableau de bord: ' + error.message 
    });
  }
};