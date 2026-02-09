// routes/exampleRoutes.js
const express = require("express");
const router = express.Router();
const exampleController = require("../controllers/exampleController");
const authenticateToken = require("../middleware/authMiddleware");
const roleGuard = require("../middleware/roleGuard");
const auditLogger = require("../middleware/auditLogger");

// Example protected route with role-based access
router.get(
  "/admin-only",
  authenticateToken,
  roleGuard(["ADMIN"]),
  exampleController.adminOnlyEndpoint
);

// Patient ID reissue route
router.post(
  "/reissue-patient-id",
  authenticateToken,
  roleGuard(["MODERATOR"]),
  auditLogger("REISSUE_PATIENT_ID"),
  exampleController.reissuePatientId
);

module.exports = router;
