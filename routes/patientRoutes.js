// routes/patientRoutes.js
const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const authenticateToken = require("../middleware/authMiddleware");
const roleGuard = require("../middleware/roleGuard");
const auditLogger = require("../middleware/auditLogger");

// Register patient
router.post(
  "/register",
  authenticateToken,
  roleGuard(["NURSE", "MODERATOR"]),
  auditLogger("REGISTER_PATIENT"),
  patientController.registerPatient
);

// Search patient by NIC
router.get(
  "/search",
  authenticateToken,
  roleGuard(["NURSE", "MODERATOR", "DOCTOR"]), // Limited access
  patientController.searchPatient
);

// Reissue patient ID
router.post(
  "/reissue-id",
  authenticateToken,
  roleGuard(["MODERATOR"]),
  auditLogger("REISSUE_PATIENT_ID"),
  patientController.reissuePatientId
);

module.exports = router;
