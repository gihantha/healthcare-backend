// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authOptional = require("../middleware/authOptional");
// const { authLoginLimiter } = require("../middleware/rateLimiters");

// Login route with rate limiter
router.post("/login", authController.login);

// Create user route (authOptional allows unauthenticated access for first bootstrap)
router.post("/create-user", authOptional, authController.createUser);

// Refresh token route
router.post("/refresh", authController.refreshToken);

module.exports = router;

