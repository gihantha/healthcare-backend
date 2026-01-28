// QR code generation utility using JWT
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

module.exports = async function generateVisitQR({ patientId, visitId, expiresIn = '1h' }) {
  const payload = {
    patientId,
    visitId,
    exp: Math.floor(Date.now() / 1000) + (typeof expiresIn === 'string' ? 3600 : expiresIn)
  };
  const token = jwt.sign(payload, process.env.QR_SECRET || 'qr_secret');
  const qrData = await QRCode.toDataURL(token);
  return { token, qrData };
};
