// services/doctorService.js
const { v4: uuidv4 } = require("uuid");
const MedicalRecord = require("../models/MedicalRecord");
const Prescription = require("../models/Prescription");

async function getPatientHistory(patientId) {
  const records = await MedicalRecord.find({ patientId })
    .sort({ createdAt: -1 })
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
  if (!diagnosis) {
    throw {
      code: "BAD_REQUEST",
      message: "Diagnosis is required",
      status: 400,
    };
  }

  const record = new MedicalRecord({
    patientId,
    visitId,
    diagnosis,
    prescriptions,
    notes,
    createdBy,
  });
  await record.save();

  let prescriptionId = null;
  if (prescriptions && prescriptions.length > 0) {
    // Prefix the prescriptionId for clarity
    const prescription = new Prescription({
      prescriptionId: `RX-${uuidv4()}`,
      visitId,
      patientId,
      medicines: prescriptions,
    });
    await prescription.save();
    prescriptionId = prescription.prescriptionId;
  }

  return { prescriptionId };
}

module.exports = { getPatientHistory, addMedicalRecord };
