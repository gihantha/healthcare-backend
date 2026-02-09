// routes/visitRoutes.js
const express = require("express");
const router = express.Router();
const visitService = require("../services/visitService");
const authenticateToken = require("../middleware/authMiddleware");
const roleGuard = require("../middleware/roleGuard");

router.post(
  "/create",
  authenticateToken,
  roleGuard(["NURSE", "MODERATOR"]),
  async (req, res, next) => {
    try {
      const result = await visitService.createVisit(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
