//routes/auditRoutes.js
const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const authenticateToken = require("../middleware/authMiddleware");
const roleGuard = require("../middleware/roleGuard");

router.get(
  "/logs",
  authenticateToken,
  roleGuard(["ADMIN"]),
  auditController.getAuditLogs
);

module.exports = router;
