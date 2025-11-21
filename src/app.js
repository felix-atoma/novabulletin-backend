// src/app.js - Express app configuration only
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Import routes
const authRoutes = require("./routes/auth");
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
  "http://localhost:3000"
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
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

/* -------------------------------------------------
   DEV LOGGING
------------------------------------------------- */
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

/* -------------------------------------------------
   API ROUTES
------------------------------------------------- */
app.use("/api/v1/auth", authRoutes);
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

/* -------------------------------------------------
   HEALTH CHECK
------------------------------------------------- */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "NovaBulletin API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    uptime: process.uptime()
  });
});

/* -------------------------------------------------
   WELCOME ROUTE
------------------------------------------------- */
app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur NovaBulletin API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      auth: "/api/v1/auth",
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
      registrations: "/api/v1/registrations"
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
      "POST /api/v1/auth/register",
      "POST /api/v1/auth/login",
      "GET /api/v1/auth/me",
      "POST /api/v1/schools",
      "GET /api/v1/schools"
    ]
  });
});

/* -------------------------------------------------
   GLOBAL ERROR HANDLER
------------------------------------------------- */
app.use(errorHandler);

module.exports = app;
