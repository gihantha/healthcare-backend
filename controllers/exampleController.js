const express = require('express');
const router = express.Router();
const auditLogger = require('../middleware/auditLogger');

// Example: Sensitive action route
router.post('/reissue-patient-id', auditLogger('REISSUE_PATIENT_ID'), async (req, res) => {
  // ...controller logic...
  res.json({ success: true });
});

module.exports = router;
