// middleware/auditLogger.js
const AuditLog = require("../models/AuditLog");

module.exports = function auditLogger(action) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return next(); // no user → no audit
      }

      const visitId = req.body?.visitId || req.params?.visitId || null;

      const ip =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        "unknown";

      await AuditLog.create({
        userId: req.user.userId, 
        role: req.user.role,
        action,
        visitId,
        ip,
      });
    } catch (err) {
      console.error("Audit log error:", err.message);
    }

    next();
  };
};
