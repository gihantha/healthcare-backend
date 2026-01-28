const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const parseNIC = require('../utils/nicParser');
const roleGuard = require('../middleware/roleGuard');

// Register patient (NURSE, MODERATOR only)
router.post('/register', roleGuard(['NURSE', 'MODERATOR']), async (req, res) => {
  const { name, address, phone, nic } = req.body;
  try {
    if (await Patient.findOne({ nic })) {
      return res.status(400).json({ error: 'NIC already exists' });
    }
    const { dob, gender } = parseNIC(nic);
    const patientId = 'P' + Date.now(); // Simple unique ID
    const patient = new Patient({ patientId, name, address, phone, nic, dob, gender });
    await patient.save();
    // Send notification (email/SMS) if required
    const notify = require('../utils/notifier');
    notify({
      to: phone,
      type: 'sms',
      message: `Patient registered. ID: ${patientId}`
    });
    res.json({ success: true, patientId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
