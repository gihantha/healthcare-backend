const express = require('express');
const router = express.Router();
const MedicalRecord = require('../models/MedicalRecord');
const roleGuard = require('../middleware/roleGuard');
const qrValidator = require('../middleware/qrValidator');

// Fetch patient medical history via QR (doctor only)
router.get('/history', roleGuard(['DOCTOR']), qrValidator, async (req, res) => {
  const { patientId } = req.qrPayload;
  const records = await MedicalRecord.find({ patientId });
  res.json(records);
});

// Add diagnosis and prescriptions (doctor only)
router.post('/add-record', roleGuard(['DOCTOR']), qrValidator, async (req, res) => {
  const { patientId, visitId } = req.qrPayload;
  const { diagnosis, prescriptions, notes } = req.body;
  const record = new MedicalRecord({
    patientId,
    visitId,
    diagnosis,
    prescriptions,
    notes,
    createdBy: req.user._id
  });
  await record.save();
  res.json({ success: true });
});

module.exports = router;
