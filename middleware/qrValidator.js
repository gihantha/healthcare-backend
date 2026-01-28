// QR validation middleware (JWT/HMAC based)
const jwt = require('jsonwebtoken');
const Visit = require('../models/Visit');

module.exports = async function qrValidator(req, res, next) {
  const qrToken = req.headers['x-qr-token'] || req.query.qrToken;
  if (!qrToken) return res.status(401).json({ error: 'QR token required' });
  try {
    const payload = jwt.verify(qrToken, process.env.QR_SECRET || 'qr_secret');
    // Check expiry
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return res.status(401).json({ error: 'QR expired' });
    }
    // Optionally check visit closed
    const visit = await Visit.findOne({ visitId: payload.visitId });
    if (!visit || visit.closed) {
      return res.status(401).json({ error: 'Visit closed or not found' });
    }
    req.qrPayload = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid QR token' });
  }
};
