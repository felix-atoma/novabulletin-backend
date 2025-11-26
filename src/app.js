// src/app.js - Express app configuration only
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

// Import routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/adminRoutes");
const schoolRoutes = require("./routes/school.routes");
const studentRoutes = require("./routes/students");
const parentRoutes = require("./routes/parent.routes");
const classRoutes = require("./routes/class.routes");
const subjectRoutes = require("./routes/subject.routes");
const gradeRoutes = require("./routes/grade.routes");
const bulletinRoutes = require("./routes/bulletin.routes");
const statisticsRoutes = require("./routes/statistics.routes");
const paymentRoutes = require("./routes/payment.routes");
const pdfRoutes = require("./routes/pdf.routes");
const registrationRoutes = require("./routes/registrationRoutes");
const dashboardRoutes = require("./routes/dashboard.routes");

// Middleware
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

/* -------------------------------------------------
   SECURITY
------------------------------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

/* -------------------------------------------------
   RATE LIMITER (disabled for tests)
------------------------------------------------- */
if (process.env.NODE_ENV !== "test") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 100 : 1000,
    message: {
      status: "error",
      message: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard."
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use("/api", limiter);
}

/* -------------------------------------------------
   CORS
------------------------------------------------- */
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000"
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "x-api-key"]
  })
);

/* -------------------------------------------------
   BODY PARSING
------------------------------------------------- */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* -------------------------------------------------
   STATIC FILES
------------------------------------------------- */
app.use("/uploads", express.static("uploads"));
app.use("/public", express.static("public"));

// Create uploads directories if they don't exist
const fs = require('fs');
const uploadDirs = ['uploads', 'uploads/bulletins', 'uploads/certificates', 'uploads/reports'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/* -------------------------------------------------
   DEV LOGGING
------------------------------------------------- */
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    
    // Log request body for non-GET requests (except auth for security)
    if (req.method !== "GET" && !req.path.includes("/auth/")) {
      console.log(`Request Body:`, JSON.stringify(req.body, null, 2).substring(0, 500) + '...');
    }
    
    next();
  });
}

/* -------------------------------------------------
   API ROUTES
------------------------------------------------- */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/schools", schoolRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/parents", parentRoutes);
app.use("/api/v1/classes", classRoutes);
app.use("/api/v1/subjects", subjectRoutes);
app.use("/api/v1/grades", gradeRoutes);
app.use("/api/v1/bulletins", bulletinRoutes);
app.use("/api/v1/statistics", statisticsRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/pdf", pdfRoutes);
app.use("/api/v1/registrations", registrationRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

/* -------------------------------------------------
   HEALTH CHECK
------------------------------------------------- */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "NovaBulletin API (Togolese System) is running 🇹🇬",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "2.1.0",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: process.env.NODE_ENV === "test" ? "test" : "production",
    features: {
      togolese_grading_system: true,
      interrogations_tracking: true,
      automatic_moyenne_calculation: true,
      coefficient_by_series: true,
      bulletin_generation: true,
      super_admin_management: true,
      platform_wide_management: true,
      pdf_generation: true // ADDED: PDF feature
    }
  });
});

/* -------------------------------------------------
   API STATUS ENDPOINT
------------------------------------------------- */
app.get("/api/status", (req, res) => {
  const routes = [
    { path: "/api/v1/auth", methods: ["POST", "GET"], description: "Authentication & user management" },
    { path: "/api/v1/admin", methods: ["GET", "POST", "PATCH"], description: "Super admin platform management" },
    { path: "/api/v1/schools", methods: ["GET", "POST", "PATCH", "DELETE"], description: "School management" },
    { path: "/api/v1/students", methods: ["GET", "POST", "PATCH", "DELETE"], description: "Student management" },
    { path: "/api/v1/parents", methods: ["GET", "POST", "PATCH", "DELETE"], description: "Parent management" },
    { path: "/api/v1/classes", methods: ["GET", "POST", "PATCH", "DELETE"], description: "Class management" },
    { 
      path: "/api/v1/subjects", 
      methods: ["GET", "POST", "PATCH", "DELETE", "BULK"], 
      description: "Subject management with Togolese coefficients"
    },
    { 
      path: "/api/v1/grades", 
      methods: ["GET", "POST", "PATCH", "DELETE", "BULK", "IMPORT", "EXPORT"], 
      description: "Grade entry with interrogations & composition"
    },
    { 
      path: "/api/v1/bulletins", 
      methods: ["GET", "POST", "PATCH", "DELETE", "GENERATE"], 
      description: "Bulletin generation with mentions"
    },
    { path: "/api/v1/statistics", methods: ["GET"], description: "Academic statistics" },
    { path: "/api/v1/payments", methods: ["GET", "POST", "PATCH", "DELETE"], description: "Payment processing" },
    { 
      path: "/api/v1/pdf", 
      methods: ["GET", "POST"], 
      description: "PDF document generation (bulletins, certificates, reports)"
    },
    { path: "/api/v1/registrations", methods: ["GET", "POST", "PATCH"], description: "Registration approval" },
    { path: "/api/v1/dashboard", methods: ["GET"], description: "Dashboard statistics" }
  ];

  res.status(200).json({
    status: "success",
    message: "NovaBulletin API Status - Système Togolais 🇹🇬",
    version: "2.1.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    endpoints: routes,
    features: {
      authentication: true,
      super_admin_management: true,
      platform_wide_control: true,
      user_management: true,
      school_management: true,
      student_management: true,
      grade_management: true,
      togolese_grading_system: true,
      interrogations_system: true,
      automatic_moyenne_calculation: true,
      coefficient_by_series: true,
      bulletin_generation: true,
      mention_system: true,
      payment_processing: true,
      statistics: true,
      multi_role_support: true,
      registration_approval: true,
      pdf_generation: true // ADDED: PDF feature
    },
    admin_features: {
      super_admin: {
        platform_statistics: true,
        user_management: true,
        school_management: true,
        registration_approval: true,
        bulk_operations: true
      },
      school_director: {
        school_management: true,
        user_approval: true,
        academic_management: true
      }
    },
    education_system: {
      levels: ["maternelle", "primaire", "college", "seconde", "premiere", "terminale"],
      series: ["A1", "A2", "A4", "B", "C", "D", "S", "G1", "G2", "F1", "F2", "F3", "F4", "F5"],
      trimesters: ["first", "second", "third"],
      grading_scale: "0-20",
      mentions: {
        "16-20": "Très Bien",
        "14-16": "Bien",
        "12-14": "Assez Bien",
        "10-12": "Passable",
        "0-10": "Insuffisant"
      }
    },
    grading_formula: {
      with_2_interrogations: "(Int1 + Int2 + Composition×2) / 3",
      with_3_interrogations: "(Int1 + Int2 + Int3 + Composition×2) / 4",
      general_average: "Σ(Moyenne × Coefficient) / Σ(Coefficients)"
    }
  });
});

/* -------------------------------------------------
   WELCOME ROUTE
------------------------------------------------- */
app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur NovaBulletin API - Système Éducatif Togolais 🇹🇬",
    version: "2.1.0",
    environment: process.env.NODE_ENV || "development",
    documentation: "Voir /api/status pour les détails des endpoints",
    system_info: {
      grading_system: "Togolese (0-20 scale)",
      interrogations: "Minimum 2 + 1 Composition",
      automatic_calculation: "Moyenne automatique",
      coefficient_support: "Par série et niveau",
      admin_management: "Super admin + School director roles",
      pdf_generation: "Bulletins, certificats, rapports" // ADDED: PDF info
    },
    endpoints: {
      auth: "/api/v1/auth",
      admin: "/api/v1/admin",
      schools: "/api/v1/schools",
      students: "/api/v1/students",
      parents: "/api/v1/parents",
      classes: "/api/v1/classes",
      subjects: "/api/v1/subjects",
      grades: "/api/v1/grades",
      bulletins: "/api/v1/bulletins",
      statistics: "/api/v1/statistics",
      payments: "/api/v1/payments",
      pdf: "/api/v1/pdf",
      registrations: "/api/v1/registrations",
      dashboard: "/api/v1/dashboard",
      health: "/api/health",
      status: "/api/status"
    },
    key_features: [
      "👑 Super Admin - Gestion complète de la plateforme",
      "🏫 Directeurs - Gestion d'école",
      "📝 Système de notation togolais (0-20)",
      "📊 2-3 interrogations + composition",
      "🎯 Calcul automatique des moyennes",
      "📚 Coefficients par série (A1-F5)",
      "📄 Génération automatique de bulletins",
      "📑 Génération de PDF (bulletins, certificats)", // ADDED: PDF feature
      "🏆 Mentions (Très Bien à Insuffisant)",
      "👥 Support multi-rôles",
      "💰 Gestion des paiements",
      "📈 Statistiques académiques"
    ],
    admin_capabilities: [
      "📊 Statistiques de la plateforme",
      "👥 Gestion de tous les utilisateurs",
      "🏫 Création et gestion des écoles",
      "✅ Approbation des inscriptions",
      "🔧 Configuration système"
    ]
  });
});

/* -------------------------------------------------
   TOGOLESE SYSTEM DOCUMENTATION ENDPOINT
------------------------------------------------- */
app.get("/api/education-system", (req, res) => {
  res.json({
    status: "success",
    data: {
      system: "Système Éducatif Togolais",
      country: "Togo 🇹🇬",
      grading_scale: {
        min: 0,
        max: 20,
        passing_grade: 10
      },
      mentions: [
        { range: "16-20", mention: "Très Bien", description: "Excellence" },
        { range: "14-16", mention: "Bien", description: "Très bon travail" },
        { range: "12-14", mention: "Assez Bien", description: "Bon travail" },
        { range: "10-12", mention: "Passable", description: "Travail acceptable" },
        { range: "0-10", mention: "Insuffisant", description: "Travail insuffisant" }
      ],
      user_roles: {
        admin: {
          description: "Administrateur de la plateforme",
          permissions: [
            "Gestion complète de toutes les écoles",
            "Création de tous types d'utilisateurs",
            "Statistiques de la plateforme",
            "Configuration système"
          ]
        },
        director: {
          description: "Directeur d'école",
          permissions: [
            "Gestion de son école",
            "Approbation des enseignants/élèves",
            "Gestion académique",
            "Statistiques de l'école"
          ]
        },
        teacher: {
          description: "Enseignant",
          permissions: [
            "Saisie des notes",
            "Consultation des classes",
            "Génération de bulletins"
          ]
        },
        student: {
          description: "Élève",
          permissions: [
            "Consultation de ses notes",
            "Téléchargement de bulletins"
          ]
        },
        parent: {
          description: "Parent",
          permissions: [
            "Suivi des résultats de son enfant",
            "Consultation des bulletins"
          ]
        }
      },
      structure: {
        maternelle: {
          description: "École maternelle",
          grading: "Pas de notation formelle"
        },
        primaire: {
          description: "École primaire",
          classes: ["CE1", "CE2", "CM1", "CM2"],
          coefficients: "Tous = 1"
        },
        college: {
          description: "Collège",
          classes: ["6e", "5e", "4e", "3e"],
          coefficients: {
            "6e-5e-4e": "Tous = 1",
            "3e": "Maths = 2, Autres = 1"
          }
        },
        lycee: {
          description: "Lycée",
          classes: ["Seconde", "Première", "Terminale"],
          series: {
            litteraires: ["A1 (Langues anciennes)", "A2 (Langues vivantes)", "A4 (Moderne)"],
            economiques: ["B (Sciences Économiques)"],
            scientifiques: ["C (Maths-Physique)", "D (Sciences Naturelles)", "S (Seconde)"],
            techniques_gestion: ["G1 (Gestion Admin)", "G2 (Informatique de Gestion)"],
            techniques_industriel: ["F1 (Génie Civil)", "F2 (Électricité)", "F3 (Mécanique)", "F4 (Électronique)", "F5 (Informatique)"]
          }
        }
      },
      assessment_structure: {
        interrogations: {
          minimum: 2,
          maximum: 3,
          description: "Contrôles durant le trimestre"
        },
        composition: {
          count: 1,
          weight: 2,
          description: "Examen final de trimestre (compté double)"
        },
        calculation: {
          with_2_interrogations: "(Int1 + Int2 + Comp×2) / 3",
          with_3_interrogations: "(Int1 + Int2 + Int3 + Comp×2) / 4"
        }
      },
      trimesters: [
        { id: "first", name: "Premier Trimestre", period: "Septembre - Décembre" },
        { id: "second", name: "Deuxième Trimestre", period: "Janvier - Mars" },
        { id: "third", name: "Troisième Trimestre", period: "Avril - Juin" }
      ]
    }
  });
});

/* -------------------------------------------------
   404 HANDLER
------------------------------------------------- */
app.all("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} non trouvée sur ce serveur`,
    availableEndpoints: [
      "GET /",
      "GET /api/health",
      "GET /api/status",
      "GET /api/education-system",
      "POST /api/v1/auth/register",
      "POST /api/v1/auth/login",
      "GET /api/v1/auth/me",
      // Admin endpoints
      "POST /api/v1/admin/setup/first-admin",
      "GET /api/v1/admin/users",
      "POST /api/v1/admin/users",
      "PATCH /api/v1/admin/users/:userId/status",
      "GET /api/v1/admin/schools",
      "POST /api/v1/admin/schools",
      "PATCH /api/v1/admin/schools/:schoolId",
      "GET /api/v1/admin/stats",
      "GET /api/v1/admin/registrations/pending",
      "PATCH /api/v1/admin/registrations/approve/:userId",
      "PATCH /api/v1/admin/registrations/reject/:userId",
      // PDF endpoints (ADDED)
      "POST /api/v1/pdf/generate/bulletin",
      "POST /api/v1/pdf/generate/certificate", 
      "POST /api/v1/pdf/generate/report",
      "GET /api/v1/pdf/download/:filename",
      "GET /api/v1/pdf/health",
      // Existing endpoints
      "GET /api/v1/dashboard/stats",
      "GET /api/v1/dashboard/activity",
      "POST /api/v1/schools",
      "GET /api/v1/schools",
      "POST /api/v1/students",
      "GET /api/v1/students",
      "GET /api/v1/subjects",
      "POST /api/v1/subjects",
      "POST /api/v1/subjects/bulk",
      "GET /api/v1/subjects/class/:classId",
      "GET /api/v1/subjects/coefficients",
      "POST /api/v1/grades",
      "POST /api/v1/grades/bulk",
      "GET /api/v1/grades/student/:studentId/:trimester",
      "GET /api/v1/grades/class/:classId/subject/:subjectId/:trimester",
      "POST /api/v1/bulletins/generate",
      "POST /api/v1/bulletins/generate/bulk",
      "GET /api/v1/bulletins/:id/download"
    ],
    suggestion: "Consultez GET /api/status pour la liste complète des endpoints disponibles",
    documentation: "Consultez GET /api/education-system pour comprendre le système éducatif togolais"
  });
});

/* -------------------------------------------------
   GLOBAL ERROR HANDLER
------------------------------------------------- */
app.use(errorHandler);

module.exports = app;