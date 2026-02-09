//routes/doctorRoutes.js
const express = require("express");
const router = express.Router();
const doctorService = require("../services/doctorService");
const authenticateToken = require("../middleware/authMiddleware");
const roleGuard = require("../middleware/roleGuard");
const qrValidator = require("../middleware/qrValidator");

// Get patient history via QR
router.get(
  "/history",
  authenticateToken,
  roleGuard(["DOCTOR"]),
  qrValidator,
  async (req, res, next) => {
    try {
      const records = await doctorService.getPatientHistory(
        req.qrPayload.patientId
      );
      res.json(records);
    } catch (err) {
      next(err);
    }
  }
);

// Add medical record & prescriptions
router.post(
  "/add-record",
  authenticateToken,
  roleGuard(["DOCTOR"]),
  qrValidator,
  async (req, res, next) => {
    try {
      const { patientId, visitId } = req.qrPayload;
      const { diagnosis, prescriptions, notes } = req.body;
      const result = await doctorService.addMedicalRecord({
        patientId,
        visitId,
        diagnosis,
        prescriptions,
        notes,
        createdBy: req.user.userId,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
