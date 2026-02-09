// routes/pharmacyRoutes.js
const express = require("express");
const router = express.Router();
const pharmacyService = require("../services/pharmacyService");
const authenticateToken = require("../middleware/authMiddleware");
const roleGuard = require("../middleware/roleGuard");
const auditLogger = require("../middleware/auditLogger");

// View prescription
router.get(
  "/prescription/:prescriptionId",
  authenticateToken,
  roleGuard(["PHARMACIST"]),
  async (req, res, next) => {
    try {
      const result = await pharmacyService.getPrescription(
        req.params.prescriptionId
      );
      res.json(result);
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
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
