const express = require("express");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const cors = require("cors");

// Required environment variables
const requiredEnvVars = ["JWT_SECRET", "QR_SECRET", "MONGO_URI", "FRONTEND_URL"];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

const app = express();

// ---------------------
// Middleware
// ---------------------

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — must be before routes
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:8080" || "*",
  credentials: true,
};
app.use(cors({
  origin: ["http://localhost:3001", "http://localhost:8080"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-qr-token"],
}));
// JSON parse error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      code: "INVALID_JSON",
      message: "Request body contains invalid JSON",
    });
  }
  next(err);
});

// ---------------------
// MongoDB Connection
// ---------------------
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
}

// ---------------------
// Routes
// ---------------------

app.get("/setup/check", async (req, res) => {
  try {
    const User = require("./models/User");
    const userCount = await User.countDocuments();
    const users = await User.find().select("nic name role createdAt").lean();

    res.json({
      success: true,
      database: "connected",
      userCount,
      users,
      isFirstTimeSetup: userCount === 0,
      message:
        userCount === 0
          ? "No users found. Use POST /auth/create-user with admin data to create first user."
          : "System already has users.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      database: "error",
    });
  }
});

// Import route modules
app.use("/auth", require("./routes/authRoutes"));
app.use("/patient", require("./routes/patientRoutes"));
app.use("/visit", require("./routes/visitRoutes"));
app.use("/doctor", require("./routes/doctorRoutes"));
app.use("/pharmacy", require("./routes/pharmacyRoutes"));
app.use("/audit", require("./routes/auditRoutes"));
app.use("/example", require("./routes/exampleRoutes"));
app.use("/user", require("./routes/userRoutes"));

// Swagger docs
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, "swagger.json"))
);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get("/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.json({
    status: "ok",
    uptime: process.uptime(),
    database: isDbConnected ? "connected" : "disconnected",
    memory: process.memoryUsage(),
    timestamp: Date.now(),
  });
});

// ---------------------
// Global error handler
// ---------------------
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Server error";
  const code = err.code || "SERVER_ERROR";

  const finalMessage =
    process.env.NODE_ENV === "production" && status === 500
      ? "Internal server error"
      : message;

  res.status(status).json({ code, message: finalMessage });
});

// ---------------------
// Start server
// ---------------------
if (process.env.NODE_ENV !== "test" && require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;
