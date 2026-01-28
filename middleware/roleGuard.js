// Role-based access control middleware
module.exports = function roleGuard(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // License expiry check for DOCTOR/NURSE
    if ((req.user.role === 'DOCTOR' || req.user.role === 'NURSE') && req.user.licenseExpiry) {
      if (new Date(req.user.licenseExpiry) < new Date()) {
        return res.status(403).json({ error: 'License expired' });
      }
    }
    next();
  };
};
