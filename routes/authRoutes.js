// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const authMiddleware = require("../middleware/authMiddleware");
const authOptional = require("../middleware/authOptional");

router.post("/login", async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/create-user", authOptional, async (req, res, next) => {
  try {
    const result = await authService.createUser(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
