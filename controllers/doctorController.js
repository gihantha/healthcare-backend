//controllers/doctorController.js
const doctorService = require("../services/doctorService");
const { success, error } = require("../utils/response");

exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.qrPayload;
    const records = await doctorService.getPatientHistory(patientId);
    return success(res, records);
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

exports.addMedicalRecord = async (req, res) => {
  try {
    const { patientId, visitId } = req.qrPayload;
    const { diagnosis, prescriptions, notes } = req.body;

    const result = await doctorService.addMedicalRecord({
      patientId,
      visitId,
      diagnosis,
      prescriptions,
      notes,
      createdBy: req.user.userId,
    });

    return success(
      res,
      { prescriptionId: result.prescriptionId },
      "Medical record added successfully"
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
