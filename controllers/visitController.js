const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const generateVisitQR = require('../utils/qrGenerator');
const roleGuard = require('../middleware/roleGuard');

// Create a new visit and generate QR
router.post('/create', roleGuard(['NURSE', 'MODERATOR']), async (req, res) => {
  const { patientId, unit } = req.body;
  const patient = await Patient.findOne({ patientId });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  const visitId = 'V' + Date.now();
  const visit = new Visit({ visitId, patientId, unit });
  await visit.save();
  const { token, qrData } = await generateVisitQR({ patientId, visitId });
  res.json({ visitId, qrToken: token, qrImage: qrData });
});

module.exports = router;
