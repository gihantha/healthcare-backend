// controllers/visitController.js
const VisitService = require("../services/visitService");
const { success, error } = require("../utils/response");

exports.createVisit = async (req, res) => {
  try {
    const visit = await VisitService.createVisit(req.body);
    return success(res, visit, "Visit created successfully");
  } catch (err) {
    console.error(err);
    return error(
      res,
      err.code || "SERVER_ERROR",
      err.message || "Server error",
      err.status || 500
    );
  }
};
