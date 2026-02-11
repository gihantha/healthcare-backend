// controllers/patientController.js
const PatientService = require("../services/patientService");
const { success, error } = require("../utils/response");

exports.registerPatient = async (req, res) => {
  try {
    const patient = await PatientService.registerPatient(req.body);
    return success(
      res,
      { patientId: patient.patientId },
      "Patient registered successfully"
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

exports.searchPatient = async (req, res) => {
  try {
    const { nic } = req.query;
    const patient = await PatientService.searchPatientByNIC(nic);
    return success(res, {
      _id: patient._id,         
      patientId: patient.patientId,
      name: patient.name,
      phone: patient.phone,
      address: patient.address,
    });
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


exports.reissuePatientId = async (req, res) => {
  try {
    const { nic } = req.body;
    const ip =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const result = await PatientService.reissuePatientId(
      nic,
      req.user.userId,
      req.user.role,
      ip
    );

    return success(res, result, "Patient ID card reissued successfully");
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
