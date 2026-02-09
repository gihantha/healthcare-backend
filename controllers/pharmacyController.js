// controllers/pharmacyController.js
const express = require("express");
const router = express.Router();
const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const auditLogger = require("../middleware/auditLogger");
const roleGuard = require("../middleware/roleGuard");
const qrValidator = require("../middleware/qrValidator");
const authenticateToken = require("../middleware/authMiddleware");
const notify = require("../utils/notifier");

// Pharmacist views prescription
router.get(
  "/prescription/:prescriptionId",
  authenticateToken,
  roleGuard(["PHARMACIST"]),
  async (req, res) => {
    const { prescriptionId } = req.params;
    const prescription = await Prescription.findOne({ prescriptionId });
    if (!prescription) return res.status(404).json({ error: "Not found" });
    res.json({
      prescriptionId: prescription.prescriptionId,
      medicines: prescription.medicines,
      issued: prescription.issued,
      issuedAt: prescription.issuedAt,
    });
  }
);

// Mark prescription as issued
router.post(
  "/prescription/:prescriptionId/issue",
  authenticateToken,
  roleGuard(["PHARMACIST"]),
  auditLogger("ISSUE_PRESCRIPTION"),
  async (req, res) => {
    try {
      const { prescriptionId } = req.params;
      const prescription = await Prescription.findOne({ prescriptionId });

      if (!prescription) return res.status(404).json({ error: "Not found" });
      if (prescription.issued)
        return res.status(400).json({ error: "Already issued" });

      prescription.issued = true;
      prescription.issuedAt = new Date();
      prescription.issuedBy = req.user._id;
      await prescription.save();

      const patient = await Patient.findOne({
        patientId: prescription.patientId,
      });
      if (patient) {
        notify({
          to: patient.phone,
          type: "sms",
          message: `Prescription ${prescriptionId} has been issued.`,
        });
      }

      res.json({
        success: true,
        prescriptionId: prescription.prescriptionId,
        issuedAt: prescription.issuedAt,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
