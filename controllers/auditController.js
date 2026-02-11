//controllers/auditController.js
const auditService = require("../services/auditService");
const { success, error } = require("../utils/response");

exports.getAuditLogs = async (req, res) => {
  try {
    const queryParams = { ...req.query }; // make a copy
    const result = await auditService.getAuditLogs(queryParams);

    if (result.error) {
      return error(res, result.error.code, result.error.message, 400);
    }

    return success(res, result.data);
  } catch (err) {
    console.error(err);
    return error(res, "SERVER_ERROR", "Server error", 500);
  }
};

