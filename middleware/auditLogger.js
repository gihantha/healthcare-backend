const AuditLog = require('../models/AuditLog');

// Middleware to log sensitive actions
module.exports = function auditLogger(action) {
  return async function (req, res, next) {
    try {
      const { user } = req; // Assume req.user is set by auth middleware
      const visitId = req.body.visitId || req.params.visitId;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      await AuditLog.create({
        userId: user._id,
        role: user.role,
        action,
        visitId,
        ip
      });
    } catch (err) {
      // Optionally log error, but do not block request
    }
    next();
  };
};
