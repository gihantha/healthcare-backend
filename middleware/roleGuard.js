// middleware/roleGuard.js

const User = require("../models/User");

module.exports = function roleGuard(allowedRoles) {
  return async (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
    }

    // License expiry check for DOCTOR/NURSE
    if (req.user.role === "DOCTOR" || req.user.role === "NURSE") {
      try {
        const user = await User.findById(req.user.userId);
        if (
          user &&
          user.licenseExpiry &&
          new Date(user.licenseExpiry) < new Date()
        ) {
          return res.status(403).json({
            code: "LICENSE_EXPIRED",
            message: "Professional license has expired",
          });
        }
      } catch (err) {
        console.error("License check error:", err);
        // Continue without blocking if check fails
      }
    }

    next();
  };
};
