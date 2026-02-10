// utils/qrGenerator.js
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");

module.exports = async function generateVisitQR({
  patientId,
  visitId,
  expiresIn = "10h",
}) {
  const payload = { patientId, visitId };

  const token = jwt.sign(payload, process.env.QR_SECRET || "qr_secret", {
    expiresIn,
  });

  const qrData = await QRCode.toDataURL(token);
  return { token, qrData };
};

// Validate QR token
module.exports.validateQRToken = function (qrToken) {
  try {
    const payload = jwt.verify(qrToken, process.env.QR_SECRET || "qr_secret");

    return { valid: true, payload };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return { valid: false, error: "QR token expired" };
    }
    return { valid: false, error: "Invalid QR token" };
  }
};
