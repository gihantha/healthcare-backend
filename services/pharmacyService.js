// services/pharmacyService.js
const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const Visit = require("../models/Visit");
const notify = require("../utils/notifier");

async function getPrescription(prescriptionId) {
  const prescription = await Prescription.findOne({ prescriptionId });
  if (!prescription) {
    throw { code: "NOT_FOUND", message: "Prescription not found", status: 404 };
  }
  return {
    prescriptionId: prescription.prescriptionId,
    medicines: prescription.medicines,
    issued: prescription.issued,
    issuedAt: prescription.issuedAt,
  };
}

async function issuePrescription(prescriptionId, user) {
  const prescription = await Prescription.findOne({ prescriptionId });
  if (!prescription)
    throw { code: "NOT_FOUND", message: "Prescription not found", status: 404 };
  if (prescription.issued)
    throw { code: "ALREADY_ISSUED", message: "Already issued", status: 400 };

  prescription.issued = true;
  prescription.issuedAt = new Date();
  prescription.issuedBy = user.userId;
  await prescription.save();

  // Close the visit when medicine is issued
  const visit = await Visit.findOne({ visitId: prescription.visitId });
  if (visit && !visit.closed) {
    visit.closed = true;
    visit.closedAt = new Date();
    await visit.save();
  }

  const patient = await Patient.findOne({ patientId: prescription.patientId });
  if (patient) {
    notify({
      to: patient.phone,
      type: "sms",
      message: `Prescription ${prescriptionId} has been issued.`,
    });
  }

  return {
    prescriptionId: prescription.prescriptionId,
    issuedAt: prescription.issuedAt,
    visitClosed: !!visit,
  };
}

module.exports = { getPrescription, issuePrescription };
