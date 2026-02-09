// utils/qrGenerator.js
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");

module.exports = async function generateVisitQR({
  patientId,
  visitId,
  expiresIn = "10h",
}) {
  const payload = {
    patientId,
    visitId,
    exp:
      Math.floor(Date.now() / 1000) +
      (typeof expiresIn === "string" ? 36000 : expiresIn),
  };
  const token = jwt.sign(payload, process.env.QR_SECRET || "qr_secret");
  const qrData = await QRCode.toDataURL(token);
  return { token, qrData };
};

// Validate QR token
module.exports.validateQRToken = function (qrToken) {
  try {
    const payload = jwt.verify(qrToken, process.env.QR_SECRET || "qr_secret");

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { valid: false, error: "QR token expired" };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: "Invalid QR token" };
  }
};
