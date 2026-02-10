// routes/pharmacyRoutes.js
const express = require("express");
const router = express.Router();
const pharmacyService = require("../services/pharmacyService");
const authenticateToken = require("../middleware/authMiddleware");
const roleGuard = require("../middleware/roleGuard");
const qrValidator = require("../middleware/qrValidator");
const auditLogger = require("../middleware/auditLogger");

// View prescription by ID
router.get(
  "/prescription/:prescriptionId",
  authenticateToken,
  roleGuard(["PHARMACIST"]),
  async (req, res, next) => {
    try {
      const result = await pharmacyService.getPrescription(
        req.params.prescriptionId
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Get prescription by QR
router.get(
  "/prescription/qr",
  authenticateToken,
  roleGuard(["PHARMACIST"]),
  qrValidator,
  async (req, res, next) => {
    try {
      const result = await pharmacyService.getPrescriptionByQR(
        req.qrPayload.visitId
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Issue prescription
router.post(
  "/prescription/:prescriptionId/issue",
  authenticateToken,
  roleGuard(["PHARMACIST"]),
  auditLogger("ISSUE_PRESCRIPTION"),
  async (req, res, next) => {
    try {
      const result = await pharmacyService.issuePrescription(
        req.params.prescriptionId,
        req.user
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Issue prescription via QR
router.post(
  "/prescription/qr/issue",
  authenticateToken,
  roleGuard(["PHARMACIST"]),
  qrValidator,
  auditLogger("ISSUE_PRESCRIPTION"),
  async (req, res, next) => {
    try {
      const result = await pharmacyService.issuePrescriptionByQR(
        req.qrPayload.visitId,
        req.user
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
