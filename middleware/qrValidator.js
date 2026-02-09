//middleware/qrValidator.js
const jwt = require("jsonwebtoken");
const Visit = require("../models/Visit");

module.exports = async function qrValidator(req, res, next) {
  const qrToken = req.headers["x-qr-token"] || req.query.qrToken;
  if (!qrToken)
    return res
      .status(401)
      .json({ code: "NO_QR", message: "QR token required" });

  try {
    const payload = jwt.verify(qrToken, process.env.QR_SECRET || "qr_secret");

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return res
        .status(401)
        .json({ code: "QR_EXPIRED", message: "QR expired" });
    }

    const visit = await Visit.findOne({ visitId: payload.visitId });
    if (!visit || visit.closed) {
      return res
        .status(401)
        .json({ code: "VISIT_CLOSED", message: "Visit closed or not found" });
    }

    req.qrPayload = payload;
    next();
  } catch {
    return res
      .status(401)
      .json({ code: "INVALID_QR", message: "Invalid QR token" });
  }
};
