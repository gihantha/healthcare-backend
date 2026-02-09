// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authOptional = require("../middleware/authOptional");

router.post("/login", authController.login);
router.post("/create-user", authOptional, authController.createUser);

module.exports = router;
