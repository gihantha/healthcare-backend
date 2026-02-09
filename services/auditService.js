// services/auditService.js
const AuditLog = require("../models/AuditLog");

async function getAuditLogs({
  page = 1,
  limit = 50,
  startDate,
  endDate,
  role,
  action,
}) {
  const query = {};

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  if (role) query.role = role;
  if (action) query.action = action;

  const skip = (page - 1) * limit;

  const logs = await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate("userId", "nic name")
    .lean();

  const total = await AuditLog.countDocuments(query);

  return {
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

module.exports = { getAuditLogs };
