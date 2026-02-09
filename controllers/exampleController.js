// controllers/exampleController.js
const { success, error } = require("../utils/response");

exports.adminOnlyEndpoint = async (req, res) => {
  try {
    return success(res, { message: "This is an admin-only endpoint" });
  } catch (err) {
    console.error(err);
    return error(res, "SERVER_ERROR", "Server error", 500);
  }
};

exports.reissuePatientId = async (req, res) => {
  try {
    const { nic } = req.body;

    if (!nic) {
      return error(res, "BAD_REQUEST", "NIC is required", 400);
    }

    // This would be implemented in patientService
    return success(
      res,
      {
        patientId: "P-12345678",
        name: "John Doe",
        gender: "M",
        dateOfBirth: "1990-01-01",
      },
      "Patient ID card reissued"
    );
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
