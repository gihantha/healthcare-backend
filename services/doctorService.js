// services/doctorService.js
const { v4: uuidv4 } = require("uuid");
const MedicalRecord = require("../models/MedicalRecord");
const Prescription = require("../models/Prescription");
const Visit = require("../models/Visit");
const Patient = require("../models/Patient");

async function getPatientHistory(patientId) {
  const records = await MedicalRecord.find({ patientId })
    .sort({ createdAt: -1 })
    .populate("createdBy", "name role")
    .select("diagnosis prescriptions notes createdAt createdBy");
  return records;
}

async function addMedicalRecord({
  patientId,
  visitId,
  diagnosis,
  prescriptions,
  notes,
  createdBy,
}) {
  // Validation
  if (!diagnosis) {
    throw {
      code: "BAD_REQUEST",
      message: "Diagnosis is required",
      status: 400,
    };
  }

  // Create medical record without prescriptions array
  const record = new MedicalRecord({
    patientId,
    visitId,
    diagnosis,
    notes,
    createdBy,
  });

  await record.save();

  let prescriptionId = null;

  // Create separate prescription if medicines exist
  if (prescriptions && prescriptions.length > 0) {
    const prescription = new Prescription({
      prescriptionId: `RX-${uuidv4()}`,
      visitId,
      patientId,
      medicines: prescriptions,
      medicalRecordId: record._id, // Link to medical record
    });

    await prescription.save();
    prescriptionId = prescription.prescriptionId;
  }

  return { medicalRecordId: record._id, prescriptionId };
}

async function getCurrentVisitDetails(visitId) {
  const visit = await Visit.findOne({ visitId })
    .populate({
      path: "patientId",
      select: "patientId name dob gender phone",
    })
    .lean();

  if (!visit) {
    throw {
      code: "VISIT_NOT_FOUND",
      message: "Visit not found",
      status: 404,
    };
  }

  return visit;
}

module.exports = {
  getPatientHistory,
  addMedicalRecord,
  getCurrentVisitDetails,
};
