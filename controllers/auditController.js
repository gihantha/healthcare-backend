//controllers/auditController.js
const auditService = require("../services/auditService");
const { success, error } = require("../utils/response");

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await auditService.getAuditLogs(req.query);
    return success(res, logs);
  } catch (err) {
    console.error(err);
    return error(res, "SERVER_ERROR", "Server error", 500);
  }
};
