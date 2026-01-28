const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const auditLogger = require('../middleware/auditLogger');
const roleGuard = require('../middleware/roleGuard');
const qrValidator = require('../middleware/qrValidator');

// Pharmacist scans QR to view prescription details
router.get('/prescription/:prescriptionId',
  roleGuard(['PHARMACIST']),
  qrValidator,
  async (req, res) => {
    const { prescriptionId } = req.params;
    const prescription = await Prescription.findOne({ prescriptionId });
    if (!prescription) return res.status(404).json({ error: 'Not found' });
    res.json({
      prescriptionId: prescription.prescriptionId,
      medicines: prescription.medicines,
      issued: prescription.issued,
      issuedAt: prescription.issuedAt
    });
  }
);

// Mark prescription as issued
router.post('/prescription/:prescriptionId/issue',
  roleGuard(['PHARMACIST']),
  qrValidator,
  auditLogger('ISSUE_PRESCRIPTION'),
  async (req, res) => {
    const { prescriptionId } = req.params;
    const prescription = await Prescription.findOne({ prescriptionId });
    if (!prescription) return res.status(404).json({ error: 'Not found' });
    if (prescription.issued) return res.status(400).json({ error: 'Already issued' });
    prescription.issued = true;
    prescription.issuedAt = new Date();
    prescription.issuedBy = req.user._id;
    await prescription.save();
    // Send notification (email/SMS) if required
    const notify = require('../utils/notifier');
    notify({
      to: prescription.patientId, // You may want to look up patient phone/email
      type: 'sms',
      message: `Prescription ${prescriptionId} has been issued.`
    });
    res.json({ success: true });
  }
);

module.exports = router;
