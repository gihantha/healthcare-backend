//index.js
const express = require("express");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Routes
app.use("/auth", require("./routes/authRoutes"));
app.use("/patient", require("./routes/patientRoutes"));
app.use("/visit", require("./routes/visitRoutes"));
app.use("/doctor", require("./routes/doctorRoutes"));
app.use("/pharmacy", require("./routes/pharmacyRoutes"));
app.use("/audit", require("./routes/auditRoutes"));
app.use("/example", require("./routes/exampleRoutes"));

// Swagger docs
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, "swagger.json"))
);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Global error response middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Server error";
  const code = err.code || "SERVER_ERROR";

  // Don't expose server errors in production
  const finalMessage =
    process.env.NODE_ENV === "production" && status === 500
      ? "Internal server error"
      : message;

  res.status(status).json({ code, message: finalMessage });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
